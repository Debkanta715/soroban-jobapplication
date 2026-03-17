import { spawn } from "node:child_process";
import { config } from "./config.js";

function toCliArg(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

export async function invokeContract(method, params = {}, sourceAccount) {
  const idOrAlias = config.contractAlias || config.contractId;
  const accountToUse = sourceAccount || config.sourceAccount;

  if (!idOrAlias) {
    throw new Error("Contract ID or alias is not configured.");
  }

  if (!accountToUse) {
    throw new Error("Source account is not configured. Set STELLAR_SOURCE_ACCOUNT or pass sourceAccount.");
  }

  const args = ["contract", "invoke", "--id", idOrAlias, "--network", config.network];

  args.push("--source-account", accountToUse);

  args.push("--", method);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    args.push(`--${key}`, toCliArg(value));
  });

  return new Promise((resolve, reject) => {
    const child = spawn(config.stellarCliPath, args, { shell: false });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Failed to execute Stellar CLI: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ ok: true, output: stdout.trim(), command: `${config.stellarCliPath} ${args.join(" ")}` });
        return;
      }

      reject(
        new Error(
          `Stellar CLI failed with code ${code}.\nCommand: ${config.stellarCliPath} ${args.join(" ")}\n${stderr || stdout}`
        )
      );
    });
  });
}
