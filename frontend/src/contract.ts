/**
 * contract.ts — Soroban Job Board contract interaction layer.
 *
 * Wraps every on-chain call so the rest of the UI only imports typed
 * functions from this file.
 *
 * Read operations use a fake source account (simulation only, never submitted).
 * Write operations require a connected Freighter wallet.
 *
 * Uses @stellar/stellar-sdk v14 (rpc namespace) and
 * @stellar/freighter-api v6 ({ address } return shapes).
 */

import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
  rpc,
} from "@stellar/stellar-sdk";
import type { Application, ApplicationStatus, Job } from "./types";

// ─── Network Configuration ────────────────────────────────────────────────────

export const NETWORK_PASSPHRASE =
  (import.meta.env.VITE_NETWORK_PASSPHRASE as string | undefined) ??
  Networks.TESTNET;

export const RPC_URL =
  (import.meta.env.VITE_RPC_URL as string | undefined) ??
  "https://soroban-testnet.stellar.org";

/**
 * Set VITE_CONTRACT_ID in your .env file after deploying the contract.
 * Example:  VITE_CONTRACT_ID=CCXYZ...
 */
export const CONTRACT_ID =
  (import.meta.env.VITE_CONTRACT_ID as string | undefined) ??
  "YOUR_CONTRACT_ID_HERE";

const server = new rpc.Server(RPC_URL, { allowHttp: false });

export interface WalletNetworkStatus {
  isMatch: boolean;
  walletNetwork: string;
  walletPassphrase: string;
  expectedPassphrase: string;
}

function shortNetworkName(passphrase: string): string {
  if (passphrase === Networks.PUBLIC) return "Mainnet";
  if (passphrase === Networks.TESTNET) return "Testnet";
  if (passphrase === Networks.FUTURENET) return "Futurenet";
  return "Custom";
}

function wrongNetworkMessage(walletPassphrase: string): string {
  return `Wrong wallet network. Dapp expects ${shortNetworkName(NETWORK_PASSPHRASE)} but your wallet is on ${shortNetworkName(walletPassphrase)}.`;
}

function parseFreighterError(err: unknown): string {
  const text = String(err ?? "").toLowerCase();
  if (
    /rejected|declined|denied|cancelled|canceled/.test(text)
  ) {
    return "Transaction signature was rejected in Freighter.";
  }
  if (/popup|closed|window closed/.test(text)) {
    return "Freighter popup was closed before signing completed.";
  }
  if (/timeout/.test(text)) {
    return "Freighter request timed out. Please try again.";
  }
  return String(err);
}

async function assertWalletNetworkMatches(): Promise<void> {
  const info = await checkWalletNetwork();
  if (!info) return;
  if (!info.isMatch) {
    throw new Error(wrongNetworkMessage(info.walletPassphrase));
  }
}

// ─── Wallet Helpers ───────────────────────────────────────────────────────────

/** Returns the Freighter public key (opens permission prompt if needed). */
export async function connectWallet(): Promise<string> {
  const { isConnected, requestAccess, getAddress } =
    await import("@stellar/freighter-api");

  // Freighter can report either boolean-like status or fail silently in some contexts.
  const connRes = await isConnected();
  const isInstalled = Boolean(connRes?.isConnected || (window as { freighter?: unknown }).freighter);

  if (!isInstalled) {
    throw new Error(
      "Freighter wallet not found. Install the Freighter browser extension and reload.",
    );
  }

  const res = await requestAccess();
  if (res.error) throw new Error(String(res.error));

  // Prefer address from requestAccess; fallback to getAddress if missing.
  if (res.address) return res.address;

  const addrRes = await getAddress();
  if (addrRes.error || !addrRes.address) {
    throw new Error("Wallet connected, but no public address was returned by Freighter.");
  }

  await assertWalletNetworkMatches();
  return addrRes.address;
}

/** Returns wallet network status vs the dapp network, or null when unavailable. */
export async function checkWalletNetwork(): Promise<WalletNetworkStatus | null> {
  try {
    const { getNetworkDetails } = await import("@stellar/freighter-api");
    const details = await getNetworkDetails();
    if (details.error || !details.networkPassphrase) return null;

    return {
      isMatch: details.networkPassphrase === NETWORK_PASSPHRASE,
      walletNetwork: details.network,
      walletPassphrase: details.networkPassphrase,
      expectedPassphrase: NETWORK_PASSPHRASE,
    };
  } catch {
    return null;
  }
}

export function getExpectedNetworkName(): string {
  return shortNetworkName(NETWORK_PASSPHRASE);
}

/** Returns the connected public key, or null when not connected. */
export async function getConnectedAddress(): Promise<string | null> {
  try {
    const { isConnected, getAddress } = await import(
      "@stellar/freighter-api"
    );
    const connRes = await isConnected();
    if (!connRes?.isConnected) return null;
    const res = await getAddress();
    return res.error ? null : res.address;
  } catch {
    return null;
  }
}

// ─── ScVal Helpers ────────────────────────────────────────────────────────────

const u64Val = (n: number | bigint) =>
  nativeToScVal(BigInt(n), { type: "u64" });

const i128Val = (n: number | bigint) =>
  nativeToScVal(BigInt(n), { type: "i128" });

const addrVal = (addr: string) => new Address(addr).toScVal();

const strVal = (s: string) => nativeToScVal(s, { type: "string" });

const vecStrVal = (arr: string[]): xdr.ScVal =>
  xdr.ScVal.scvVec(arr.map(strVal));

const statusVal = (status: ApplicationStatus): xdr.ScVal =>
  xdr.ScVal.scvVec([nativeToScVal(status, { type: "symbol" })]);

// ─── Low-level call helpers ───────────────────────────────────────────────────

/**
 * Simulate a read-only contract call without requiring a funded account.
 * A synthetic source account (sequence 0) is used — simulation never submits.
 */
async function simulateRead<T>(
  method: string,
  args: xdr.ScVal[],
): Promise<T | null> {
  // Any valid Stellar address works here — simulation is local to the RPC node
  const fakeAccount = new Account(
    "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    "0",
  );
  const tx = new TransactionBuilder(fakeAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(CONTRACT_ID).call(method, ...args))
    .setTimeout(0)
    .build();

  try {
    const sim = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) return null;
    const native = scValToNative(sim.result.retval);
    // Option<T> comes back as undefined/null when None
    if (native === null || native === undefined) return null;
    return native as T;
  } catch {
    return null;
  }
}

/**
 * Build, simulate, sign (via Freighter), and submit a state-changing call.
 * Returns the transaction hash after confirmation.
 */
async function invokeWrite(
  signerKey: string,
  method: string,
  args: xdr.ScVal[],
): Promise<string> {
  const { signTransaction } = await import("@stellar/freighter-api");

  // Enforce network match right before signing/submitting.
  await assertWalletNetworkMatches();

  const account = await server.getAccount(signerKey);
  const rawTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(CONTRACT_ID).call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate to get footprint & auth entries
  const sim = await server.simulateTransaction(rawTx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation error: ${JSON.stringify(sim)}`);
  }

  // Assemble adds footprint + auth back into tx
  const preparedTx = rpc.assembleTransaction(rawTx, sim).build();

  // Sign via Freighter — returns { signedTxXdr }
  const signResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: signerKey,
  });
  if (signResult.error) {
    throw new Error(parseFreighterError(signResult.error));
  }
  const { signedTxXdr } = signResult;

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const sendRes = await server.sendTransaction(signedTx);
  if (sendRes.status === "ERROR") {
    throw new Error(`Submit error: ${JSON.stringify(sendRes.errorResult)}`);
  }

  // Poll until confirmed
  const hash = sendRes.hash;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const getRes = await server.getTransaction(hash);
    if (getRes.status === rpc.Api.GetTransactionStatus.SUCCESS)
      return hash;
    if (getRes.status === rpc.Api.GetTransactionStatus.FAILED)
      throw new Error("Transaction failed on-chain.");
  }
  throw new Error("Transaction timed out waiting for confirmation.");
}

// ─── Data Normalizers ─────────────────────────────────────────────────────────

function normalizeJob(raw: Record<string, unknown>): Job {
  return {
    id: Number(raw.id ?? 0),
    employer: String(raw.employer ?? ""),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    location: String(raw.location ?? ""),
    required_skills: Array.isArray(raw.required_skills)
      ? (raw.required_skills as unknown[]).map(String)
      : [],
    salary_min: Number(raw.salary_min ?? 0),
    salary_max: Number(raw.salary_max ?? 0),
    is_open: Boolean(raw.is_open ?? true),
    created_at: Number(raw.created_at ?? 0),
  };
}

function normalizeApplication(raw: Record<string, unknown>): Application {
  return {
    id: Number(raw.id ?? 0),
    job_id: Number(raw.job_id ?? 0),
    applicant: String(raw.applicant ?? ""),
    cover_letter: String(raw.cover_letter ?? ""),
    resume_link: String(raw.resume_link ?? ""),
    status: parseStatus(raw.status),
    applied_at: Number(raw.applied_at ?? 0),
  };
}

function parseStatus(raw: unknown): ApplicationStatus {
  if (typeof raw === "string") {
    if (raw.includes("Accept")) return "Accepted";
    if (raw.includes("Reject")) return "Rejected";
    return "Pending";
  }
  if (typeof raw === "object" && raw !== null) {
    if ("Accepted" in raw) return "Accepted";
    if ("Rejected" in raw) return "Rejected";
  }
  return "Pending";
}

// ─── Public Contract API ──────────────────────────────────────────────────────

/** Fetch a single job by ID. Returns null if the job does not exist. */
export async function getJob(jobId: number): Promise<Job | null> {
  const raw = await simulateRead<Record<string, unknown>>("get_job", [
    u64Val(jobId),
  ]);
  return raw ? normalizeJob(raw) : null;
}

/**
 * Scan IDs 1 … maxId and return all **open** jobs.
 * Stops early on the first null (IDs are sequential).
 */
export async function listOpenJobs(maxId = 50): Promise<Job[]> {
  const jobs: Job[] = [];
  for (let id = 1; id <= maxId; id++) {
    const job = await getJob(id);
    if (!job) break;
    if (job.is_open) jobs.push(job);
  }
  return jobs;
}

/**
 * Scan IDs 1 … maxId and return ALL jobs (for employer dashboard).
 * Stops early on the first null.
 */
export async function listAllJobs(maxId = 50): Promise<Job[]> {
  const jobs: Job[] = [];
  for (let id = 1; id <= maxId; id++) {
    const job = await getJob(id);
    if (!job) break;
    jobs.push(job);
  }
  return jobs;
}

/** Post a new job. Requires employer's wallet. */
export async function createJob(params: {
  employer: string;
  title: string;
  description: string;
  location: string;
  requiredSkills: string[];
  salaryMin: number;
  salaryMax: number;
}): Promise<string> {
  return invokeWrite(params.employer, "create_job", [
    addrVal(params.employer),
    strVal(params.title),
    strVal(params.description),
    strVal(params.location),
    vecStrVal(params.requiredSkills),
    i128Val(params.salaryMin),
    i128Val(params.salaryMax),
  ]);
}

/** Apply to a job. Requires applicant's wallet. */
export async function applyToJob(params: {
  applicant: string;
  jobId: number;
  coverLetter: string;
  resumeLink: string;
}): Promise<string> {
  return invokeWrite(params.applicant, "apply_to_job", [
    addrVal(params.applicant),
    u64Val(params.jobId),
    strVal(params.coverLetter),
    strVal(params.resumeLink),
  ]);
}

/** Fetch a single application by ID. Returns null if not found. */
export async function getApplication(
  applicationId: number,
): Promise<Application | null> {
  const raw = await simulateRead<Record<string, unknown>>("get_application", [
    u64Val(applicationId),
  ]);
  return raw ? normalizeApplication(raw) : null;
}

/** Accept or reject an application. Employer only. */
export async function setApplicationStatus(params: {
  employer: string;
  applicationId: number;
  status: ApplicationStatus;
}): Promise<string> {
  return invokeWrite(params.employer, "set_application_status", [
    addrVal(params.employer),
    u64Val(params.applicationId),
    statusVal(params.status),
  ]);
}

/** Open or close a job posting. Employer only. */
export async function setJobOpenStatus(params: {
  employer: string;
  jobId: number;
  isOpen: boolean;
}): Promise<string> {
  return invokeWrite(params.employer, "set_job_open_status", [
    addrVal(params.employer),
    u64Val(params.jobId),
    nativeToScVal(params.isOpen, { type: "bool" }),
  ]);
}

/** All application IDs for a given job. */
export async function listJobApplicationIds(jobId: number): Promise<number[]> {
  const result = await simulateRead<bigint[]>("list_job_application_ids", [
    u64Val(jobId),
  ]);
  return (result ?? []).map(Number);
}

/** All application IDs for a given applicant. */
export async function listApplicantApplicationIds(
  applicant: string,
): Promise<number[]> {
  const result = await simulateRead<bigint[]>(
    "list_applicant_application_ids",
    [addrVal(applicant)],
  );
  return (result ?? []).map(Number);
}
