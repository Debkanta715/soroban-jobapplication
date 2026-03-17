import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { connectDatabase, SiteContent } from "./db.js";
import { defaultContent } from "./defaultContent.js";
import { buildProviderAuthUrl, completeOAuth, getProviderStatus } from "./oauth.js";
import { invokeContract } from "./stellarCli.js";

const app = express();

app.use(cors());
app.use(express.json());

const supportedProviders = ["google", "facebook", "github"];

function isValidProvider(provider) {
  return supportedProviders.includes(provider);
}

function resolveRedirectTarget(rawRedirect) {
  if (!rawRedirect) {
    return `${config.frontendUrl}/auth/callback`;
  }

  return rawRedirect;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "backend", network: config.network, contractId: config.contractId || config.contractAlias });
});

app.get("/api/content", async (_req, res) => {
  try {
    let doc = await SiteContent.findOne({ key: "site-content" }).lean();

    if (!doc) {
      doc = await SiteContent.create({ key: "site-content", content: defaultContent });
    }

    res.json({ ok: true, content: doc.content || defaultContent });
  } catch (error) {
    res.status(500).json({ ok: false, error: `Content fetch failed: ${error.message}` });
  }
});

app.put("/api/content", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== "object") {
      res.status(400).json({ ok: false, error: "Invalid content payload." });
      return;
    }

    const doc = await SiteContent.findOneAndUpdate(
      { key: "site-content" },
      { key: "site-content", content },
      { new: true, upsert: true }
    ).lean();

    res.json({ ok: true, content: doc.content });
  } catch (error) {
    res.status(500).json({ ok: false, error: `Content save failed: ${error.message}` });
  }
});

app.get("/api/auth/providers", (_req, res) => {
  res.json({ ok: true, providers: getProviderStatus() });
});

app.get("/api/auth/:provider/start", (req, res) => {
  try {
    const { provider } = req.params;
    if (!isValidProvider(provider)) {
      res.status(404).json({ ok: false, error: "Unsupported auth provider." });
      return;
    }

    const redirectTo = resolveRedirectTarget(req.query.redirect);
    const authUrl = buildProviderAuthUrl(provider, redirectTo);
    res.redirect(authUrl);
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.get("/api/auth/:provider/callback", async (req, res) => {
  const { provider } = req.params;
  if (!isValidProvider(provider)) {
    res.status(404).json({ ok: false, error: "Unsupported auth provider." });
    return;
  }

  const { code, state } = req.query;

  if (!code || !state) {
    res.status(400).json({ ok: false, error: "Missing OAuth code/state." });
    return;
  }

  try {
    const result = await completeOAuth(provider, { code, state });

    const redirectPayload = Buffer.from(JSON.stringify({
      provider: result.provider,
      profile: result.profile
    })).toString("base64url");

    const redirectUrl = `${result.redirectTo}${result.redirectTo.includes("?") ? "&" : "?"}status=success&data=${encodeURIComponent(redirectPayload)}`;
    res.redirect(redirectUrl);
  } catch (error) {
    const fallback = `${config.frontendUrl}/auth/callback`;
    const redirectUrl = `${fallback}?status=error&message=${encodeURIComponent(error.message)}`;
    res.redirect(redirectUrl);
  }
});

app.get("/api/jobs/:jobId", async (req, res) => {
  try {
    const result = await invokeContract("get_job", { job_id: req.params.jobId });
    res.json(result);
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.get("/api/applications/:applicationId", async (req, res) => {
  try {
    const result = await invokeContract("get_application", { application_id: req.params.applicationId });
    res.json(result);
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.get("/api/jobs/:jobId/application-ids", async (req, res) => {
  try {
    const result = await invokeContract("list_job_application_ids", { job_id: req.params.jobId });
    res.json(result);
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.post("/api/jobs", async (req, res) => {
  try {
    const { sourceAccount, employer, title, description, location, required_skills, salary_min, salary_max } = req.body;

    const result = await invokeContract(
      "create_job",
      {
        employer,
        title,
        description,
        location,
        required_skills,
        salary_min,
        salary_max
      },
      sourceAccount
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.post("/api/jobs/:jobId/apply", async (req, res) => {
  try {
    const { sourceAccount, applicant, cover_letter, resume_link } = req.body;

    const result = await invokeContract(
      "apply_to_job",
      {
        applicant,
        job_id: req.params.jobId,
        cover_letter,
        resume_link
      },
      sourceAccount
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.post("/api/applications/:applicationId/status", async (req, res) => {
  try {
    const { sourceAccount, employer, status } = req.body;

    const result = await invokeContract(
      "set_application_status",
      {
        employer,
        application_id: req.params.applicationId,
        status
      },
      sourceAccount
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

async function startServer() {
  try {
    await connectDatabase();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Database connection failed: ${error.message}`);
  }

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend API running on http://localhost:${config.port}`);
  });
}

startServer();
