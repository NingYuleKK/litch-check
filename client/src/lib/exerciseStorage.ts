/**
 * Exercise module localStorage persistence layer.
 * All data is stored locally — no cloud backend needed for this version.
 */

import type { TrainingRecord, StarredAction } from "../../../shared/exercise";

const STORAGE_KEYS = {
  TRAINING_RECORDS: "litch-check-training-records",
  STARRED_ACTIONS: "litch-check-starred-actions",
} as const;

// ─── Training Records ─────────────────────────────────────────

/** Get all training records */
export function getAllTrainingRecords(): TrainingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRAINING_RECORDS);
    if (!raw) return [];
    return JSON.parse(raw) as TrainingRecord[];
  } catch {
    return [];
  }
}

/** Get training record for a specific date */
export function getTrainingRecordByDate(dateStr: string): TrainingRecord | null {
  const records = getAllTrainingRecords();
  return records.find((r) => r.dateStr === dateStr) ?? null;
}

/** Save or update a training record */
export function saveTrainingRecord(record: TrainingRecord): void {
  const records = getAllTrainingRecords();
  const idx = records.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    records[idx] = { ...record, updatedAt: new Date().toISOString() };
  } else {
    records.push(record);
  }
  localStorage.setItem(STORAGE_KEYS.TRAINING_RECORDS, JSON.stringify(records));
}

/** Delete a training record */
export function deleteTrainingRecord(id: string): void {
  const records = getAllTrainingRecords().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.TRAINING_RECORDS, JSON.stringify(records));
}

/** Get training records for a specific month */
export function getTrainingRecordsByMonth(year: number, month: number): TrainingRecord[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return getAllTrainingRecords().filter((r) => r.dateStr.startsWith(prefix));
}

// ─── Starred Actions (Favorites) ──────────────────────────────

/** Get all starred actions */
export function getStarredActions(): StarredAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STARRED_ACTIONS);
    if (!raw) return [];
    return JSON.parse(raw) as StarredAction[];
  } catch {
    return [];
  }
}

/** Add a starred action */
export function addStarredAction(action: StarredAction): void {
  const actions = getStarredActions();
  // Avoid duplicates by name
  if (actions.some((a) => a.name === action.name)) return;
  actions.push(action);
  localStorage.setItem(STORAGE_KEYS.STARRED_ACTIONS, JSON.stringify(actions));
}

/** Remove a starred action */
export function removeStarredAction(id: string): void {
  const actions = getStarredActions().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEYS.STARRED_ACTIONS, JSON.stringify(actions));
}

/** Update a starred action */
export function updateStarredAction(action: StarredAction): void {
  const actions = getStarredActions();
  const idx = actions.findIndex((a) => a.id === action.id);
  if (idx >= 0) {
    actions[idx] = action;
    localStorage.setItem(STORAGE_KEYS.STARRED_ACTIONS, JSON.stringify(actions));
  }
}

/** Check if an action name is starred */
export function isActionStarred(name: string): boolean {
  return getStarredActions().some((a) => a.name === name);
}
