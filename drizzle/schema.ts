import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Daily check-in records.
 * Each row = one task on one date.
 * - dateStr: "YYYY-MM-DD" format for easy querying
 * - taskId: 1-5 matching TASK_TYPES
 * - completed: whether the task is checked off
 * - note: optional text about what was done
 */
export const checkins = mysqlTable("checkins", {
  id: int("id").autoincrement().primaryKey(),
  dateStr: varchar("dateStr", { length: 10 }).notNull(), // "2026-02-22"
  taskId: int("taskId").notNull(),                        // 1-5
  completed: boolean("completed").default(false).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = typeof checkins.$inferInsert;

/**
 * Daily free-form log / diary.
 * One entry per date, independent from task check-ins.
 */
export const dailyLogs = mysqlTable("daily_logs", {
  id: int("id").autoincrement().primaryKey(),
  dateStr: varchar("dateStr", { length: 10 }).notNull().unique(), // "2026-02-22"
  content: text("content"),
  gptComment: text("gptComment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyLog = typeof dailyLogs.$inferSelect;
export type InsertDailyLog = typeof dailyLogs.$inferInsert;

// ─── Exercise Module Tables (v3.0) ────────────────────────────

/**
 * Training records: stores each exercise session for a date.
 * Each row = one exercise entry on one date.
 * - exerciseId: references PRESET_EXERCISES id (string slug)
 * - sets: number of sets (optional)
 * - duration: duration string like "30分钟" (optional)
 * - note: additional note about this exercise
 */
export const trainingRecords = mysqlTable("training_records", {
  id: int("id").autoincrement().primaryKey(),
  dateStr: varchar("dateStr", { length: 10 }).notNull(),     // "2026-03-02"
  exerciseId: varchar("exerciseId", { length: 64 }).notNull(), // "kettlebell-swing"
  sets: int("sets"),                                           // number of sets
  duration: varchar("duration", { length: 32 }),               // "30分钟"
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type InsertTrainingRecord = typeof trainingRecords.$inferInsert;

/**
 * Starred (favorited) exercises.
 * Users can star exercises to add them to their "常用动作库".
 */
export const starredExercises = mysqlTable("starred_exercises", {
  id: int("id").autoincrement().primaryKey(),
  exerciseId: varchar("exerciseId", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StarredExercise = typeof starredExercises.$inferSelect;
export type InsertStarredExercise = typeof starredExercises.$inferInsert;
