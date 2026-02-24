import { and, eq, gte, lte, desc, asc, sql, min } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, checkins, dailyLogs, type Checkin, type DailyLog } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { TASK_TYPES, STAR_THRESHOLD, LOTUS_THRESHOLD } from "../shared/tasks";
import {
  type WeeklyReviewData,
  type WeeklyReviewListItem,
  type TaskWeeklyStat,
  getWeekSunday,
  getWeeklyCatComment,
  getWeekMonday,
  generateWeekStarts,
} from "../shared/weeklyReview";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Check-in Queries ───────────────────────────────────────────

/**
 * Get all check-ins for a specific date.
 * Returns existing records; missing tasks should be filled client-side.
 */
export async function getCheckinsByDate(dateStr: string): Promise<Checkin[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(checkins)
    .where(eq(checkins.dateStr, dateStr));
}

/**
 * Upsert a check-in record (toggle or update note).
 * Uses dateStr + taskId as the logical key.
 */
export async function upsertCheckin(data: {
  dateStr: string;
  taskId: number;
  completed: boolean;
  note?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if record exists
  const existing = await db
    .select()
    .from(checkins)
    .where(and(eq(checkins.dateStr, data.dateStr), eq(checkins.taskId, data.taskId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(checkins)
      .set({
        completed: data.completed,
        note: data.note !== undefined ? data.note : existing[0].note,
      })
      .where(eq(checkins.id, existing[0].id));
  } else {
    // Insert new
    await db.insert(checkins).values({
      dateStr: data.dateStr,
      taskId: data.taskId,
      completed: data.completed,
      note: data.note ?? null,
    });
  }
}

/**
 * Update only the note for a specific check-in.
 */
export async function updateCheckinNote(data: {
  dateStr: string;
  taskId: number;
  note: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(checkins)
    .where(and(eq(checkins.dateStr, data.dateStr), eq(checkins.taskId, data.taskId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(checkins)
      .set({ note: data.note })
      .where(eq(checkins.id, existing[0].id));
  } else {
    // Create record with note (not yet completed)
    await db.insert(checkins).values({
      dateStr: data.dateStr,
      taskId: data.taskId,
      completed: false,
      note: data.note,
    });
  }
}

/**
 * Get monthly summary: for each day in the month, count completed tasks.
 * Returns array of { dateStr, completedCount }.
 */
export async function getMonthlySummary(
  year: number,
  month: number
): Promise<{ dateStr: string; completedCount: number }[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const result = await db
    .select({
      dateStr: checkins.dateStr,
      completedCount: sql<number>`SUM(CASE WHEN ${checkins.completed} = true THEN 1 ELSE 0 END)`,
    })
    .from(checkins)
    .where(and(gte(checkins.dateStr, startDate), lte(checkins.dateStr, endDate)))
    .groupBy(checkins.dateStr);

  return result.map((r) => ({
    dateStr: r.dateStr,
    completedCount: Number(r.completedCount),
  }));
}

/**
 * Calculate current streak: consecutive days (going back from today)
 * where completedCount >= 3.
 */
export async function calculateStreak(todayStr: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // Get all dates with their completion counts, ordered desc
  const result = await db
    .select({
      dateStr: checkins.dateStr,
      completedCount: sql<number>`SUM(CASE WHEN ${checkins.completed} = true THEN 1 ELSE 0 END)`,
    })
    .from(checkins)
    .groupBy(checkins.dateStr)
    .orderBy(desc(checkins.dateStr));

  // Build a map of dateStr -> completedCount
  const dateMap = new Map<string, number>();
  for (const row of result) {
    dateMap.set(row.dateStr, Number(row.completedCount));
  }

  // Walk backwards from today
  let streak = 0;
  let current = new Date(todayStr + "T00:00:00Z");

  while (true) {
    const ds = current.toISOString().slice(0, 10);
    const count = dateMap.get(ds) ?? 0;
    if (count >= 3) {
      streak++;
      current.setUTCDate(current.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ─── Delete Check-in Note ──────────────────────────────────────

/**
 * Delete (clear) the note for a specific check-in.
 * If the task is not completed and has no note, remove the record entirely.
 */
export async function deleteCheckinNote(data: {
  dateStr: string;
  taskId: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(checkins)
    .where(and(eq(checkins.dateStr, data.dateStr), eq(checkins.taskId, data.taskId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(checkins)
      .set({ note: null })
      .where(eq(checkins.id, existing[0].id));
  }
}

// ─── Daily Log Queries ─────────────────────────────────────────

/**
 * Get daily log for a specific date.
 */
export async function getDailyLog(dateStr: string): Promise<DailyLog | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.dateStr, dateStr))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Upsert daily log content.
 */
export async function upsertDailyLog(data: {
  dateStr: string;
  content: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.dateStr, data.dateStr))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(dailyLogs)
      .set({ content: data.content })
      .where(eq(dailyLogs.id, existing[0].id));
  } else {
    await db.insert(dailyLogs).values({
      dateStr: data.dateStr,
      content: data.content,
    });
  }
}

// ─── GPT Comment Queries ──────────────────────────────────────

/**
 * Get GPT comment for a specific date.
 */
export async function getGptComment(dateStr: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({ gptComment: dailyLogs.gptComment })
    .from(dailyLogs)
    .where(eq(dailyLogs.dateStr, dateStr))
    .limit(1);

  return result.length > 0 ? (result[0].gptComment ?? null) : null;
}

/**
 * Save/update GPT comment for a specific date.
 * Creates a daily_logs row if one doesn't exist yet.
 */
export async function upsertGptComment(data: {
  dateStr: string;
  gptComment: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.dateStr, data.dateStr))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(dailyLogs)
      .set({ gptComment: data.gptComment })
      .where(eq(dailyLogs.id, existing[0].id));
  } else {
    await db.insert(dailyLogs).values({
      dateStr: data.dateStr,
      gptComment: data.gptComment,
    });
  }
}

// ─── Weekly Review Queries ────────────────────────────────────

/**
 * Get weekly review data for a specific week (Monday to Sunday).
 * weekStart must be a Monday in "YYYY-MM-DD" format.
 */
export async function getWeeklyReview(weekStart: string): Promise<WeeklyReviewData | null> {
  const db = await getDb();
  if (!db) return null;

  const weekEnd = getWeekSunday(weekStart);

  // Get all checkins for this week
  const weekCheckins = await db
    .select()
    .from(checkins)
    .where(
      and(
        gte(checkins.dateStr, weekStart),
        lte(checkins.dateStr, weekEnd)
      )
    );

  // Build per-day completion counts
  const dayCompletions = new Map<string, number>();
  const taskDayCompletions = new Map<string, Set<string>>(); // taskId -> set of dateStrs

  for (const c of weekCheckins) {
    if (c.completed) {
      dayCompletions.set(c.dateStr, (dayCompletions.get(c.dateStr) ?? 0) + 1);
      const key = String(c.taskId);
      if (!taskDayCompletions.has(key)) {
        taskDayCompletions.set(key, new Set());
      }
      taskDayCompletions.get(key)!.add(c.dateStr);
    }
  }

  // Calculate star days (≥3 completions) and lotus days (5 completions)
  let starDays = 0;
  let lotusDays = 0;
  let totalCompletions = 0;

  dayCompletions.forEach((count) => {
    totalCompletions += count;
    if (count >= STAR_THRESHOLD) starDays++;
    if (count >= LOTUS_THRESHOLD) lotusDays++;
  });

  // Build per-task stats
  const taskStats: TaskWeeklyStat[] = TASK_TYPES.map((t) => ({
    taskId: t.id,
    taskName: t.name,
    completedDays: taskDayCompletions.get(String(t.id))?.size ?? 0,
  }));

  // Generate cat comment
  const catComment = getWeeklyCatComment(starDays, lotusDays, weekStart);

  return {
    weekStart,
    weekEnd,
    starDays,
    lotusDays,
    taskStats,
    totalCompletions,
    catComment,
  };
}

/**
 * Get all available weekly reviews (list of weeks that have any checkin data).
 * Returns most recent first.
 */
export async function getWeeklyReviews(): Promise<WeeklyReviewListItem[]> {
  const db = await getDb();
  if (!db) return [];

  // Get the earliest and latest checkin dates
  const dateRange = await db
    .select({
      earliest: min(checkins.dateStr),
    })
    .from(checkins);

  const earliest = dateRange[0]?.earliest;
  if (!earliest) return [];

  // Get today's date as the latest boundary
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Generate all week starts from earliest to now
  const weekStarts = generateWeekStarts(earliest, todayStr);

  // For each week, get summary data
  const results: WeeklyReviewListItem[] = [];

  for (const ws of weekStarts) {
    const weekEnd = getWeekSunday(ws);

    const weekCheckins = await db
      .select({
        dateStr: checkins.dateStr,
        completedCount: sql<number>`SUM(CASE WHEN ${checkins.completed} = true THEN 1 ELSE 0 END)`,
      })
      .from(checkins)
      .where(
        and(
          gte(checkins.dateStr, ws),
          lte(checkins.dateStr, weekEnd)
        )
      )
      .groupBy(checkins.dateStr);

    let starDays = 0;
    let lotusDays = 0;
    let totalCompletions = 0;

    for (const row of weekCheckins) {
      const count = Number(row.completedCount);
      totalCompletions += count;
      if (count >= STAR_THRESHOLD) starDays++;
      if (count >= LOTUS_THRESHOLD) lotusDays++;
    }

    // Only include weeks that have at least some data
    if (totalCompletions > 0) {
      results.push({
        weekStart: ws,
        weekEnd,
        starDays,
        lotusDays,
        totalCompletions,
      });
    }
  }

  return results;
}
