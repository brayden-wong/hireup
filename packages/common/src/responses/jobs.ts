import type { JobType, JobEnvironment, ApplicantStatus } from "../constants";

export const CreateJob = "Job application created";

export const CreateJobError = [
  "Incorrect role",
  "Failed to create job",
] as const;

export const GetMyJobsError = [
  "Failed to get my jobs",
  "Unathorized role",
] as const;

type UserApplicant = {
  id: number;
  slug: string;
  firstName: string;
  lastName: string;
};

type Applicant = {
  id: string;
  jobId: string;
  userId: number;
  status: ApplicantStatus;
  resumeUrl: string;
  portfolioUrl?: string;
  user: UserApplicant;
};

type BaseJob = {
  id: number;
  slug: string;
  title: string;
  userId: number;
  company: string;
  description: string;
  location: string;
  type: JobType;
  environment: JobEnvironment;
  salaryMin: number;
  salaryMax?: number;
  createdAt: Date;
};

export type GetRecuiterJobs = BaseJob & {
  applicants: Applicant[];
};

export type UserRecommendedJobs = Omit<BaseJob, "description"> & {
  applicants: { userId: number }[];
};
