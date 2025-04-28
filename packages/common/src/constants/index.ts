export const ACCOUNTS = ["user", "recruiter", "admin"] as const;
export type AccountType = (typeof ACCOUNTS)[number];

export const CONVERSATION_PERMISSIONS = ["owner", "participant"] as const;
export type ConversationPermission = (typeof CONVERSATION_PERMISSIONS)[number];

export const EXPERIENCE = [
  "none",
  "junior",
  "mid",
  "senior",
  "manager",
] as const;
export type Experience = (typeof EXPERIENCE)[number];

export const JOB_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_ENVIRONMENTS = ["on-site", "remote", "hybrid"] as const;
export type JobEnvironment = (typeof JOB_ENVIRONMENTS)[number];

export const APPLICANT_STATUSES = [
  "applied",
  "reviewed",
  "interviewing",
  "offer",
  "hired",
  "rejected",
  "no-response",
] as const;
export type ApplicantStatus = (typeof APPLICANT_STATUSES)[number];

export const FEATURE_FLAGS = ["jobs", "conversations"] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

export const FEATURE_FLAG_STATUS = [
  "enabled",
  "disabled",
  "beta",
  "soon",
  "new",
] as const;
export type FeatureFlagStatus = (typeof FEATURE_FLAG_STATUS)[number];

export const SENT_MESSAGE = "sent_message";

export * from "./skills";

export const NOTIFICATION_TYPES = [
  "new_message",
  "job_application_received",
  "connection_request",
  "connection_accepted",
] as const;
