/**
 * Database operations for the Exercise module.
 */
import { and, eq, desc, sql, asc } from "drizzle-orm";
import { getDb } from "./db";
import { trainingRecords, starredExercises, type TrainingRecord, type StarredExercise } from "../drizzle/schema";

// ─── Training Records ─────────────────────────────────────────

/**
 * Get all training records for a specific date.
 */
export async function getTrainingRecordsByDate(dateStr: string): Promise<TrainingRecord[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(trainingRecords)
    .where(eq(trainingRecords.dateStr, dateStr))
    .orderBy(asc(trainingRecords.id));
}

/**
 * Add a training record entry.
 */
export async function addTrainingRecord(data: {
  dateStr: string;
  exerciseId: string;
  sets?: number | null;
  duration?: string | null;
  note?: string | null;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(trainingRecords).values({
    dateStr: data.dateStr,
    exerciseId: data.exerciseId,
    sets: data.sets ?? null,
    duration: data.duration ?? null,
    note: data.note ?? null,
  });

  return { id: Number(result[0].insertId) };
}

/**
 * Update a training record entry.
 */
export async function updateTrainingRecord(data: {
  id: number;
  sets?: number | null;
  duration?: string | null;
  note?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateSet: Record<string, unknown> = {};
  if (data.sets !== undefined) updateSet.sets = data.sets;
  if (data.duration !== undefined) updateSet.duration = data.duration;
  if (data.note !== undefined) updateSet.note = data.note;

  if (Object.keys(updateSet).length > 0) {
    await db
      .update(trainingRecords)
      .set(updateSet)
      .where(eq(trainingRecords.id, data.id));
  }
}

/**
 * Delete a training record entry.
 */
export async function deleteTrainingRecord(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(trainingRecords).where(eq(trainingRecords.id, id));
}

/**
 * Get all dates that have training records (for calendar/history).
 * Returns array of { dateStr, exerciseCount }.
 */
export async function getTrainingDates(): Promise<{ dateStr: string; exerciseCount: number }[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      dateStr: trainingRecords.dateStr,
      exerciseCount: sql<number>`COUNT(*)`,
    })
    .from(trainingRecords)
    .groupBy(trainingRecords.dateStr)
    .orderBy(desc(trainingRecords.dateStr));

  return result.map((r) => ({
    dateStr: r.dateStr,
    exerciseCount: Number(r.exerciseCount),
  }));
}

/**
 * Get exercise stats: how many times each exercise has been done.
 * Returns array of { exerciseId, totalCount, lastDate }.
 */
export async function getExerciseStats(): Promise<{
  exerciseId: string;
  totalCount: number;
  lastDate: string;
}[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      exerciseId: trainingRecords.exerciseId,
      totalCount: sql<number>`COUNT(*)`,
      lastDate: sql<string>`MAX(${trainingRecords.dateStr})`,
    })
    .from(trainingRecords)
    .groupBy(trainingRecords.exerciseId)
    .orderBy(sql`COUNT(*) DESC`);

  return result.map((r) => ({
    exerciseId: r.exerciseId,
    totalCount: Number(r.totalCount),
    lastDate: r.lastDate,
  }));
}

// ─── Starred Exercises ────────────────────────────────────────

/**
 * Get all starred exercises.
 */
export async function getStarredExercises(): Promise<StarredExercise[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(starredExercises)
    .orderBy(desc(starredExercises.createdAt));
}

/**
 * Toggle star status for an exercise.
 * Returns the new star status.
 */
export async function toggleStarExercise(exerciseId: string): Promise<{ starred: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(starredExercises)
    .where(eq(starredExercises.exerciseId, exerciseId))
    .limit(1);

  if (existing.length > 0) {
    // Unstar
    await db.delete(starredExercises).where(eq(starredExercises.exerciseId, exerciseId));
    return { starred: false };
  } else {
    // Star
    await db.insert(starredExercises).values({ exerciseId });
    return { starred: true };
  }
}
