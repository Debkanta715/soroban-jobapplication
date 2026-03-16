import { useState } from "react";
import { createJob } from "../contract";
import type { ToastMessage } from "../App";

interface Props {
  walletAddress: string;
  onToast: (type: ToastMessage["type"], message: string) => void;
}

const EMPTY = {
  title: "",
  description: "",
  location: "",
  skillsInput: "",
  salaryMin: "",
  salaryMax: "",
};

export function CreateJobForm({ walletAddress, onToast }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const salaryMin = parseInt(form.salaryMin, 10);
    const salaryMax = parseInt(form.salaryMax, 10);
    if (isNaN(salaryMin) || isNaN(salaryMax)) {
      onToast("error", "Salary values must be valid numbers.");
      return;
    }
    if (salaryMin < 0 || salaryMax < salaryMin) {
      onToast("error", "Salary max must be ≥ salary min and both must be ≥ 0.");
      return;
    }

    const requiredSkills = form.skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const hash = await createJob({
        employer: walletAddress,
        title: form.title,
        description: form.description,
        location: form.location,
        requiredSkills,
        salaryMin,
        salaryMax,
      });
      onToast("success", `Job posted! Tx: ${hash.slice(0, 12)}…`);
      setForm(EMPTY);
    } catch (e: unknown) {
      onToast("error", e instanceof Error ? e.message : "Failed to post job.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Post a New Job</h2>
        <p className="text-slate-500 text-sm mt-1">
          This will write to the Soroban contract. Freighter will prompt you to
          sign.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="label" htmlFor="title">
            Job Title *
          </label>
          <input
            id="title"
            className="input"
            placeholder="e.g. Senior Rust Engineer"
            value={form.title}
            onChange={set("title")}
            required
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="description">
            Job Description *
          </label>
          <textarea
            id="description"
            className="input min-h-[100px] resize-y"
            placeholder="Describe responsibilities, requirements, benefits…"
            value={form.description}
            onChange={set("description")}
            required
            maxLength={2000}
          />
        </div>

        {/* Location */}
        <div>
          <label className="label" htmlFor="location">
            Location *
          </label>
          <input
            id="location"
            className="input"
            placeholder="e.g. Remote, Nairobi, San Francisco"
            value={form.location}
            onChange={set("location")}
            required
            maxLength={100}
          />
        </div>

        {/* Skills */}
        <div>
          <label className="label" htmlFor="skills">
            Required Skills
          </label>
          <input
            id="skills"
            className="input"
            placeholder="Rust, Soroban, TypeScript  (comma separated)"
            value={form.skillsInput}
            onChange={set("skillsInput")}
            maxLength={500}
          />
          <p className="text-xs text-slate-400 mt-1">Separate skills with commas</p>
        </div>

        {/* Salary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="salMin">
              Salary Min ($/yr) *
            </label>
            <input
              id="salMin"
              type="number"
              min={0}
              className="input"
              placeholder="e.g. 4000"
              value={form.salaryMin}
              onChange={set("salaryMin")}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="salMax">
              Salary Max ($/yr) *
            </label>
            <input
              id="salMax"
              type="number"
              min={0}
              className="input"
              placeholder="e.g. 8000"
              value={form.salaryMax}
              onChange={set("salaryMax")}
              required
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs text-slate-400 font-mono truncate max-w-xs">
            Employer: {walletAddress.slice(0, 8)}…{walletAddress.slice(-4)}
          </p>
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
              "Post Job"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
