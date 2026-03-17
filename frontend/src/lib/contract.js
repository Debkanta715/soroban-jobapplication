const DEFAULT_API_BASE = "http://localhost:4000/api";

async function requestJson(apiBase, path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  const data = await response.json();

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

export function parseContractOutputValue(output) {
  if (typeof output === "number") return output;
  if (typeof output !== "string") return null;

  const trimmed = output.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "number") return parsed;
    if (typeof parsed === "string" && /^\d+$/.test(parsed)) return Number(parsed);
  } catch {
    // Keep fallback parser below for non-JSON values from CLI.
  }

  const onlyDigits = trimmed.replace(/[^\d]/g, "");
  return onlyDigits ? Number(onlyDigits) : null;
}

export function createContractClient(apiBase = DEFAULT_API_BASE) {
  return {
    getJob(jobId) {
      return requestJson(apiBase, `/jobs/${jobId}`);
    },

    createJob(payload) {
      return requestJson(apiBase, "/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },

    applyToJob(jobId, payload) {
      return requestJson(apiBase, `/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },

    getApplication(applicationId) {
      return requestJson(apiBase, `/applications/${applicationId}`);
    },

    listJobApplicationIds(jobId) {
      return requestJson(apiBase, `/jobs/${jobId}/application-ids`);
    },

    setApplicationStatus(applicationId, payload) {
      return requestJson(apiBase, `/applications/${applicationId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
  };
}
