import { useCallback, useEffect, useState } from "react";
import {
  getApplication,
  getJob,
  listApplicantApplicationIds,
} from "../contract";
import type { Application, Job } from "../types";
import type { ToastMessage } from "../App";

interface Props {
  walletAddress: string;
  onToast: (type: ToastMessage["type"], message: string) => void;
}

interface AppWithJob {
  app: Application;
  job: Job | null;
}

const statusBadge = (status: Application["status"]) => {
  if (status === "Accepted") return <span className="badge-accepted">✔ Accepted</span>;
  if (status === "Rejected") return <span className="badge-rejected">✖ Rejected</span>;
  return <span className="badge-pending">⏳ Pending</span>;
};

export function MyApplications({ walletAddress, onToast }: Props) {
  const [items, setItems] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ids = await listApplicantApplicationIds(walletAddress);
      const results = await Promise.all(
        ids.map(async (id) => {
          const app = await getApplication(id);
          if (!app) return null;
          const job = await getJob(app.job_id);
          return { app, job } as AppWithJob;
        }),
      );
      setItems(results.filter(Boolean) as AppWithJob[]);
    } catch {
      onToast("error", "Failed to load your applications.");
    } finally {
      setLoading(false);
    }
  }, [walletAddress, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Applications</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading
              ? "Loading…"
              : `${items.length} application${items.length !== 1 ? "s" : ""}`}
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
            <p className="mt-3 text-slate-500 text-sm">Loading applications…</p>
          </div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <h3 className="font-semibold text-slate-700">No applications yet</h3>
          <p className="text-slate-400 text-sm mt-1">
            Head to the Job Board and apply to a position.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {items.map(({ app, job }) => (
          <div key={app.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900">
                    {job ? job.title : `Job #${app.job_id}`}
                  </h3>
                  {statusBadge(app.status)}
                </div>

                {job && (
                  <p className="text-sm text-slate-500 mt-1">
                    📍 {job.location} · 💰{" "}
                    {job.salary_min.toLocaleString()}–
                    {job.salary_max.toLocaleString()} / yr
                  </p>
                )}

                <div className="mt-3 bg-slate-50 rounded-lg p-3 space-y-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Cover Letter
                    </h4>
                    <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">
                      {app.cover_letter}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Resume
                    </h4>
                    <a
                      href={app.resume_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-stellar-500 hover:underline break-all"
                    >
                      {app.resume_link}
                    </a>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs text-slate-400">App #{app.id}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
