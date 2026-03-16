import { useEffect, useRef, useState } from "react";
import { applyToJob } from "../contract";
import type { Job } from "../types";
import type { ToastMessage } from "../App";

interface Props {
  job: Job;
  applicant: string;
  onClose: () => void;
  onToast: (type: ToastMessage["type"], message: string) => void;
}

export function ApplyModal({ job, applicant, onClose, onToast }: Props) {
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeLink, setResumeLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic URL validation for resume link
    try {
      new URL(resumeLink);
    } catch {
      onToast("error", "Resume link must be a valid URL (e.g. https://example.com/resume.pdf).");
      return;
    }

    setSubmitting(true);
    try {
      const hash = await applyToJob({
        applicant,
        jobId: job.id,
        coverLetter,
        resumeLink,
      });
      onToast("success", `Application submitted! Tx: ${hash.slice(0, 12)}…`);
      onClose();
    } catch (e: unknown) {
      onToast(
        "error",
        e instanceof Error ? e.message : "Failed to submit application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-lg text-slate-900">Apply for Position</h2>
            <p className="text-sm text-slate-500 mt-0.5">{job.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Cover Letter */}
          <div>
            <label className="label" htmlFor="cover">
              Cover Letter *
            </label>
            <textarea
              id="cover"
              className="input min-h-[120px] resize-y"
              placeholder="Introduce yourself and explain why you're a great fit…"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              required
              maxLength={2000}
            />
          </div>

          {/* Resume Link */}
          <div>
            <label className="label" htmlFor="resume">
              Resume Link *
            </label>
            <input
              id="resume"
              type="url"
              className="input"
              placeholder="https://example.com/your-resume.pdf"
              value={resumeLink}
              onChange={(e) => setResumeLink(e.target.value)}
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Link to your resume (PDF, Google Doc, LinkedIn, etc.)
            </p>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="spinner" /> Submitting…
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
