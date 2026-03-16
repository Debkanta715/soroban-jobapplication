import { useCallback, useEffect, useState } from "react";
import {
  getApplication,
  listAllJobs,
  listJobApplicationIds,
  setApplicationStatus,
  setJobOpenStatus,
} from "../contract";
import type { Application, Job } from "../types";
import type { ToastMessage } from "../App";

interface Props {
  walletAddress: string;
  onToast: (type: ToastMessage["type"], message: string) => void;
}

interface JobWithApps {
  job: Job;
  applications: Application[];
  expanded: boolean;
  loadingApps: boolean;
}

export function EmployerDashboard({ walletAddress, onToast }: Props) {
  const [entries, setEntries] = useState<JobWithApps[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load only jobs owned by this wallet
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listAllJobs(50);
      const mine = all.filter(
        (j) => j.employer.toLowerCase() === walletAddress.toLowerCase(),
      );
      setEntries(
        mine.map((job) => ({
          job,
          applications: [],
          expanded: false,
          loadingApps: false,
        })),
      );
    } catch {
      onToast("error", "Failed to load your job postings.");
    } finally {
      setLoading(false);
    }
  }, [walletAddress, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = async (idx: number) => {
    const entry = entries[idx];

    // Collapse
    if (entry.expanded) {
      setEntries((prev) =>
        prev.map((e, i) => (i === idx ? { ...e, expanded: false } : e)),
      );
      return;
    }

    // Load applications lazily
    setEntries((prev) =>
      prev.map((e, i) =>
        i === idx ? { ...e, expanded: true, loadingApps: true } : e,
      ),
    );

    try {
      const ids = await listJobApplicationIds(entry.job.id);
      const apps = await Promise.all(
        ids.map((id) => getApplication(id)),
      );
      setEntries((prev) =>
        prev.map((e, i) =>
          i === idx
            ? {
                ...e,
                loadingApps: false,
                applications: apps.filter(Boolean) as Application[],
              }
            : e,
        ),
      );
    } catch {
      onToast("error", "Failed to load applications for this job.");
      setEntries((prev) =>
        prev.map((e, i) => (i === idx ? { ...e, loadingApps: false } : e)),
      );
    }
  };

  const handleToggleOpen = async (idx: number) => {
    const entry = entries[idx];
    const key = `toggle-${entry.job.id}`;
    setActionLoading(key);
    try {
      await setJobOpenStatus({
        employer: walletAddress,
        jobId: entry.job.id,
        isOpen: !entry.job.is_open,
      });
      onToast(
        "success",
        `Job "${entry.job.title}" is now ${entry.job.is_open ? "closed" : "open"}.`,
      );
      setEntries((prev) =>
        prev.map((e, i) =>
          i === idx
            ? { ...e, job: { ...e.job, is_open: !e.job.is_open } }
            : e,
        ),
      );
    } catch (e: unknown) {
      onToast(
        "error",
        e instanceof Error ? e.message : "Failed to update job status.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (
    jobIdx: number,
    appId: number,
    status: "Accepted" | "Rejected",
  ) => {
    const key = `status-${appId}`;
    setActionLoading(key);
    try {
      await setApplicationStatus({
        employer: walletAddress,
        applicationId: appId,
        status,
      });
      onToast("success", `Application #${appId} marked as ${status}.`);
      setEntries((prev) =>
        prev.map((e, i) =>
          i === jobIdx
            ? {
                ...e,
                applications: e.applications.map((a) =>
                  a.id === appId ? { ...a, status } : a,
                ),
              }
            : e,
        ),
      );
    } catch (err: unknown) {
      onToast(
        "error",
        err instanceof Error ? err.message : "Failed to update status.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employer Dashboard</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading
              ? "Loading…"
              : `${entries.length} job posting${entries.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary text-sm">
          {loading ? <span className="spinner" /> : "↻ Refresh"}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="text-center">
            <span className="spinner text-stellar-500" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <p className="mt-3 text-slate-500 text-sm">Loading your jobs…</p>
          </div>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">🏢</div>
          <h3 className="font-semibold text-slate-700">No jobs posted yet</h3>
          <p className="text-slate-400 text-sm mt-1">
            Switch to "Post a Job" to publish your first listing.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry, idx) => (
          <div key={entry.job.id} className="card overflow-hidden">
            {/* Job Row */}
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{entry.job.title}</h3>
                  {entry.job.is_open ? (
                    <span className="badge-open">● Open</span>
                  ) : (
                    <span className="badge-closed">◉ Closed</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  📍 {entry.job.location} · 💰{" "}
                  {entry.job.salary_min.toLocaleString()}–
                  {entry.job.salary_max.toLocaleString()} / yr
                </p>
                {entry.job.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {entry.job.required_skills.map((s) => (
                      <span
                        key={s}
                        className="bg-stellar-50 text-stellar-600 text-xs px-2 py-0.5 rounded border border-stellar-100"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggleOpen(idx)}
                  disabled={actionLoading === `toggle-${entry.job.id}`}
                  className={entry.job.is_open ? "btn-secondary text-sm" : "btn-primary text-sm"}
                >
                  {actionLoading === `toggle-${entry.job.id}` ? (
                    <span className="spinner" />
                  ) : entry.job.is_open ? (
                    "Close Job"
                  ) : (
                    "Reopen"
                  )}
                </button>
                <button
                  onClick={() => toggleExpand(idx)}
                  className="btn-secondary text-sm"
                >
                  {entry.expanded ? "Hide" : "Applications"}
                </button>
              </div>
            </div>

            {/* Applications Panel */}
            {entry.expanded && (
              <div className="border-t border-slate-100 bg-slate-50 p-5">
                {entry.loadingApps ? (
                  <div className="flex justify-center py-6">
                    <span className="spinner text-stellar-500" />
                  </div>
                ) : entry.applications.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No applications yet for this job.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-600">
                      {entry.applications.length} Application{entry.applications.length !== 1 ? "s" : ""}
                    </h4>
                    {entry.applications.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-slate-500 truncate">
                              {app.applicant}
                            </p>
                            <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">
                              {app.cover_letter}
                            </p>
                            <a
                              href={app.resume_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-stellar-500 hover:underline mt-1 inline-block break-all"
                            >
                              📎 {app.resume_link}
                            </a>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            {app.status === "Pending" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleStatusChange(idx, app.id, "Accepted")
                                  }
                                  disabled={
                                    actionLoading === `status-${app.id}`
                                  }
                                  className="btn-primary text-xs py-1 px-3"
                                >
                                  {actionLoading === `status-${app.id}` ? (
                                    <span className="spinner" />
                                  ) : (
                                    "Accept"
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(idx, app.id, "Rejected")
                                  }
                                  disabled={
                                    actionLoading === `status-${app.id}`
                                  }
                                  className="btn-danger text-xs py-1 px-3"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span
                                className={
                                  app.status === "Accepted"
                                    ? "badge-accepted"
                                    : "badge-rejected"
                                }
                              >
                                {app.status === "Accepted" ? "✔ Accepted" : "✖ Rejected"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
