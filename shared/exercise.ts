/**
 * Exercise module type definitions for Litch's Check.
 * Data is stored locally (localStorage) — no cloud backend needed.
 */

/** A single exercise set within a training record */
export interface ExerciseSet {
  /** Set number (1-based) */
  setNumber: number;
  /** Reps count or duration string, e.g. "12" or "30s" */
  value: string;
  /** Optional weight or intensity, e.g. "20kg" */
  weight?: string;
}

/** A single exercise action/movement */
export interface ExerciseAction {
  /** Unique ID (nanoid) */
  id: string;
  /** Action name, e.g. "深蹲", "俯卧撑" */
  name: string;
  /** Optional description / notes */
  description?: string;
  /** Image URL for the action (司马黑 doing the exercise) — placeholder for now */
  imageUrl?: string;
  /** Sets performed */
  sets: ExerciseSet[];
  /** Duration in minutes (alternative to sets, e.g. for cardio) */
  duration?: number;
  /** Type: "sets" for set-based, "duration" for time-based */
  type: "sets" | "duration";
}

/** A daily training record */
export interface TrainingRecord {
  /** Unique ID (nanoid) */
  id: string;
  /** Date string "YYYY-MM-DD" */
  dateStr: string;
  /** List of exercise actions performed */
  actions: ExerciseAction[];
  /** Optional overall note for the session */
  note?: string;
  /** Created timestamp (ISO string) */
  createdAt: string;
  /** Updated timestamp (ISO string) */
  updatedAt: string;
}

/** A starred (favorite) exercise action template */
export interface StarredAction {
  /** Unique ID (nanoid) */
  id: string;
  /** Action name */
  name: string;
  /** Optional description */
  description?: string;
  /** Image URL (placeholder) */
  imageUrl?: string;
  /** Default type */
  type: "sets" | "duration";
  /** Default sets template (optional) */
  defaultSets?: ExerciseSet[];
  /** Default duration (optional) */
  defaultDuration?: number;
  /** When it was starred (ISO string) */
  starredAt: string;
}

/** Placeholder image for exercises — 司马黑 doing exercise */
export const EXERCISE_PLACEHOLDER_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/86672527/NLEYWWCLSTPqEeUP.png";

/** Pre-defined common exercises for quick selection */
export const COMMON_EXERCISES: { name: string; type: "sets" | "duration"; description: string }[] = [
  { name: "俯卧撑", type: "sets", description: "经典上肢训练" },
  { name: "深蹲", type: "sets", description: "腿部力量基础" },
  { name: "平板支撑", type: "duration", description: "核心稳定训练" },
  { name: "引体向上", type: "sets", description: "背部拉力训练" },
  { name: "卷腹", type: "sets", description: "腹肌训练" },
  { name: "开合跳", type: "duration", description: "全身有氧热身" },
  { name: "哑铃弯举", type: "sets", description: "二头肌训练" },
  { name: "硬拉", type: "sets", description: "后链力量训练" },
  { name: "卧推", type: "sets", description: "胸部力量训练" },
  { name: "跑步", type: "duration", description: "有氧耐力训练" },
  { name: "跳绳", type: "duration", description: "全身协调有氧" },
  { name: "瑜伽", type: "duration", description: "柔韧与放松" },
  { name: "弓步蹲", type: "sets", description: "单腿力量训练" },
  { name: "臀桥", type: "sets", description: "臀部激活训练" },
  { name: "侧平举", type: "sets", description: "肩部训练" },
];
