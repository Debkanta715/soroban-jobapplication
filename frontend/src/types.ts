// ─── Domain Types ─────────────────────────────────────────────────────────────

export type ApplicationStatus = "Pending" | "Accepted" | "Rejected";

export interface Job {
  id: number;
  employer: string;
  title: string;
  description: string;
  location: string;
  required_skills: string[];
  salary_min: number;
  salary_max: number;
  is_open: boolean;
  created_at: number;
}

export interface Application {
  id: number;
  job_id: number;
  applicant: string;
  cover_letter: string;
  resume_link: string;
  status: ApplicationStatus;
  applied_at: number;
}
