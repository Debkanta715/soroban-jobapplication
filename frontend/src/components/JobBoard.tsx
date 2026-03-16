import { useEffect, useState } from "react";
import { listOpenJobs } from "../contract";
import type { Job } from "../types";
import type { ToastMessage } from "../App";
import { ApplyModal } from "./ApplyModal.tsx";

interface Props {
  walletAddress: string | null;
  onToast: (type: ToastMessage["type"], message: string) => void;
}

function formatSalary(min: number, max: number) {
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
  return `${fmt(min)} – ${fmt(max)}`;
}

function timeAgo(timestamp: number) {
  if (!timestamp) return "";
  const secs = Math.floor(Date.now() / 1000) - timestamp;
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function JobBoard({ walletAddress, onToast }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const fetched = await listOpenJobs(50);
      setJobs(fetched);
    } catch {
      onToast("error", "Failed to load jobs from the contract.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Open Positions</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading ? "Loading…" : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} available`}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary text-sm">
          {loading ? <span className="spinner" /> : "↻ Refresh"}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="text-center">
            <span className="spinner text-stellar-500 w-8 h-8" style={{ borderWidth: 3 }} />
            <p className="mt-3 text-slate-500 text-sm">Reading from Soroban…</p>
          </div>
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="font-semibold text-slate-700">No open jobs yet</h3>
          <p className="text-slate-400 text-sm mt-1">
            Switch to "Post a Job" to create the first listing.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {jobs.map((job) => (
          <article key={job.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900 text-lg leading-tight">
                    {job.title}
                  </h3>
                  <span className="badge-open">● Open</span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500 flex-wrap">
                  <span>📍 {job.location}</span>
                  <span>💰 {formatSalary(job.salary_min, job.salary_max)} / yr</span>
                  {job.created_at > 0 && (
                    <span>🕐 {timeAgo(job.created_at)}</span>
                  )}
                </div>

                <p className="text-slate-600 text-sm mt-2 line-clamp-2">
                  {job.description}
                </p>

                {job.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-stellar-50 text-stellar-600 text-xs px-2 py-0.5 rounded-md font-medium border border-stellar-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-3 font-mono truncate">
                  Employer: {job.employer}
                </p>
              </div>

              <button
                onClick={() => {
                  if (!walletAddress) {
                    onToast("info", "Connect your wallet to apply.");
                    return;
                  }
                  setApplyJob(job);
                }}
                className="btn-primary text-sm shrink-0"
              >
                Apply
              </button>
            </div>
          </article>
        ))}
      </div>

      {applyJob && walletAddress && (
        <ApplyModal
          job={applyJob}
          applicant={walletAddress}
          onClose={() => setApplyJob(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}
