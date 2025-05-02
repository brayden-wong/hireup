import { relations, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  integer,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
  uniqueIndex,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

import {
  ACCOUNTS,
  CONVERSATION_PERMISSIONS,
  APPLICANT_STATUSES,
  JOB_ENVIRONMENTS,
  JOB_TYPES,
  FEATURE_FLAG_STATUS,
  EXPERIENCE,
  NOTIFICATION_TYPES,
} from "@hireup/common/constants";

function generateId(): string {
  return createId();
}

export const AccountType = pgEnum("account_type", ACCOUNTS);

export const ConversationPermissions = pgEnum(
  "conversation_permissions",
  CONVERSATION_PERMISSIONS
);

export const JobType = pgEnum("job_type", JOB_TYPES);

export const JobEnvironment = pgEnum("job_environment", JOB_ENVIRONMENTS);

export const Experience = pgEnum("experience", EXPERIENCE);

export const Applicants = pgEnum("applicant_status", APPLICANT_STATUSES);

export const Notifications = pgEnum("notification_type", NOTIFICATION_TYPES);

export const FeatureFlagStatus = pgEnum(
  "feature_flag_status",
  FEATURE_FLAG_STATUS
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 24 }).notNull().$defaultFn(generateId),
    firstName: varchar("first_name", { length: 128 }).notNull(),
    lastName: varchar("last_name", { length: 128 }).notNull(),
    email: varchar("email", { length: 128 }).notNull().unique(),
    password: text("password").notNull(),
    account: AccountType("account").notNull().default("user"),
    betaUser: boolean("beta_user").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => [index("user_slug_idx").on(table.slug)]
);

export const profiles = pgTable("profiles", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  experience: Experience("experience").notNull(),
  location: varchar("location", { length: 64 }).notNull(),
  portfolioUrl: varchar("portfolio_url", { length: 256 }),
  resumeUrl: varchar("resume_url", { length: 256 }),
  resumeKey: varchar("resume_key", { length: 256 }),
  createdAt: timestamp("created_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
    () => new Date()
  ),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 24 })
    .primaryKey()
    .notNull()
    .$defaultFn(generateId),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isValid: boolean("is_valid").default(true),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  userAgent: varchar("user_agent", { length: 1024 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at", { mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  lastActive: timestamp("last_active", { mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 24 }).notNull().$defaultFn(generateId),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    lastActive: timestamp("last_active", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    archived: boolean("archived").notNull().default(false),
  },
  (t) => [
    index("conversation_slug_idx").on(t.slug),
    index("conversations_archived_idx").on(t.archived),
    index("conversations_creator_id_idx").on(t.creatorId),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id),
    replyId: integer("reply_id").references((): AnyPgColumn => messages.id),
    content: text("content").notNull(),
    read: boolean("read").notNull().default(false),
    deleted: boolean("deleted").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("message_created_at_idx").on(t.createdAt),
    index("messages_conversation_id_idx").on(t.conversationId),
    index("message_content_idx").using(
      "gin",
      sql`to_tsvector('english', ${t.content})`
    ),
    index("message_conversation_created_at_idx").on(
      t.conversationId,
      t.createdAt
    ),
  ]
);

export const participants = pgTable(
  "conversation_participants",
  {
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    permission: ConversationPermissions("permission")
      .notNull()
      .default("participant"),
    archived: boolean("archived").notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.userId] }),
    index("conversation_participants_user_id_idx").on(t.userId),
    index("conversation_participants_archived_idx").on(t.archived),
    index("conversation_participants_conversation_id_idx").on(t.conversationId),
  ]
);

export const requests = pgTable(
  "connection_requests",
  {
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id),
    receiverId: integer("receiver_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [primaryKey({ columns: [t.senderId, t.receiverId] })]
);

export const connections = pgTable(
  "connections",
  {
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id),
    receiverId: integer("receiver_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [primaryKey({ columns: [t.senderId, t.receiverId] })]
);

export const skills = pgTable(
  "skills",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    predefined: boolean("predefined").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [unique("unique_skill_name_idx").on(t.name)]
);

export const userSkills = pgTable(
  "user_skills",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.skillId] }),
    index("user_skills_skill_id_idx").on(t.skillId),
  ]
);

export const jobs = pgTable(
  "jobs",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 24 }).notNull().$defaultFn(generateId),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 64 }).notNull(),
    company: varchar("company", { length: 128 }).notNull(),
    description: text("description").notNull(),
    location: varchar("location", { length: 128 }).notNull(),
    type: JobType("type").default("full-time"),
    environment: JobEnvironment("environment").default("on-site"),
    relativeExperience: Experience("relative_experience").default("none"),
    salaryMin: integer("salary_min").notNull(),
    salaryMax: integer("salary_max"),
    applicationUrl: varchar("application_url", { length: 256 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("title_idx").on(t.title),
    index("poster_idx").on(t.userId),
    index("company_idx").on(t.company),
    index("location_idx").on(t.location),
    index("salary_min_idx").on(t.salaryMin),
    index("salary_max_idx").on(t.salaryMax),
    index("title_search_idx").using(
      "gin",
      sql`to_tsvector('english', ${t.title})`
    ),
    index("description_idx").using(
      "gin",
      sql`to_tsvector('english', ${t.description})`
    ),
  ]
);

export const jobSkills = pgTable(
  "job_skills",
  {
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.jobId, t.skillId] }),
    index("job_skills_job_id_idx").on(t.jobId),
    index("job_skills_skill_id_idx").on(t.skillId),
  ]
);

export const applicants = pgTable(
  "applicants",
  {
    id: varchar("id", { length: 24 })
      .primaryKey()
      .notNull()
      .$defaultFn(generateId),
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    status: Applicants("status").default("applied"),
    resumeUrl: varchar("resume_url", { length: 256 }),
    coverLetterUrl: varchar("cover_letter_url", { length: 256 }),
    portfolioUrl: varchar("portfolio_url", { length: 256 }),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("job_id_idx").on(t.jobId),
    index("status_idx").on(t.status),
    index("applicant_id").on(t.userId),
    uniqueIndex("unique_applicant_idx").on(t.jobId, t.userId),
  ]
);

export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  status: FeatureFlagStatus("status").notNull().default("disabled"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => new Date()),
});

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: Notifications("type").notNull(),
    message: varchar("message", { length: 128 }).notNull(),
    link: varchar("link", { length: 128 }),
    entityId: integer("entity_id").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (t) => [
    index("notification_user_idx").on(t.userId),
    index("notification_read_idx").on(t.read),
  ]
);

export const userRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  conversations: many(conversations),
  messages: many(messages),
  participants: many(participants),
  requests: many(requests, { relationName: "sender" }),
  receivedRequests: many(requests, { relationName: "receiver" }),
  sentConnections: many(connections, { relationName: "sent" }),
  receivedConnections: many(connections, { relationName: "received" }),
  jobs: many(jobs),
  applicants: many(applicants),
  notifications: many(notifications),
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
}));

export const profileRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  skills: many(userSkills),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const conversationRelations = relations(
  conversations,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [conversations.creatorId],
      references: [users.id],
    }),
    messages: many(messages),
    participants: many(participants),
  })
);

export const participantRelations = relations(participants, ({ one }) => ({
  user: one(users, {
    references: [users.id],
    fields: [participants.userId],
  }),
  conversation: one(conversations, {
    references: [conversations.id],
    fields: [participants.conversationId],
  }),
}));

export const messsageRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  reply: one(messages, {
    fields: [messages.replyId],
    references: [messages.id],
  }),
}));

export const requestRelations = relations(requests, ({ one }) => ({
  sender: one(users, {
    fields: [requests.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [requests.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const connectionRelations = relations(connections, ({ one }) => ({
  sent: one(users, {
    fields: [connections.senderId],
    references: [users.id],
    relationName: "sent",
  }),
  received: one(users, {
    fields: [connections.receiverId],
    references: [users.id],
    relationName: "received",
  }),
}));

export const skillRelations = relations(skills, ({ many }) => ({
  userSkills: many(userSkills),
  jobSkills: many(jobSkills),
}));

export const userSkillRelations = relations(userSkills, ({ one }) => ({
  user: one(profiles, {
    fields: [userSkills.userId],
    references: [profiles.userId],
  }),
  skill: one(skills, {
    fields: [userSkills.skillId],
    references: [skills.id],
  }),
}));

export const jobSkillRelations = relations(jobSkills, ({ one }) => ({
  job: one(jobs, {
    fields: [jobSkills.jobId],
    references: [jobs.id],
  }),
  skill: one(skills, {
    fields: [jobSkills.skillId],
    references: [skills.id],
  }),
}));

export const jobRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
  skills: many(jobSkills),
  applicants: many(applicants),
}));

export const applicantRelations = relations(applicants, ({ one }) => ({
  job: one(jobs, {
    fields: [applicants.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [applicants.userId],
    references: [users.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
