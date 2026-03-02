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
  /** Image URL for the action (司马黑 doing the exercise) */
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
  /** Image URL */
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
export const COMMON_EXERCISES: { name: string; type: "sets" | "duration"; description: string; imageUrl?: string }[] = [
  { name: "壶铃摇摆", type: "sets", description: "全身力量训练，锻炼臀部和核心", imageUrl: "/exercise-images/kettlebell-swing.png" },
  { name: "深蹲", type: "sets", description: "下肢力量之王，强化腿部和臀部", imageUrl: "/exercise-images/squat.png" },
  { name: "哑铃推举", type: "sets", description: "肩部和上肢力量训练", imageUrl: "/exercise-images/dumbbell-press.png" },
  { name: "转呼啦圈", type: "duration", description: "有趣的核心训练，燃脂好帮手", imageUrl: "/exercise-images/hula-hoop.png" },
  { name: "椭圆仪", type: "duration", description: "低冲击有氧运动，保护关节", imageUrl: "/exercise-images/elliptical.png" },
  { name: "散步", type: "duration", description: "最简单的运动，放松身心", imageUrl: "/exercise-images/walking.png" },
  { name: "泡沫滚轴放松", type: "duration", description: "肌肉放松恢复，缓解酸痛", imageUrl: "/exercise-images/foam-roller.png" },
  { name: "炮筒划船", type: "sets", description: "背部力量训练，改善体态", imageUrl: "/exercise-images/landmine-row.png" },
  { name: "太极拳", type: "duration", description: "身心合一，柔中带刚", imageUrl: "/exercise-images/tai-chi.png" },
  { name: "俯卧撑", type: "sets", description: "经典上肢训练" },
  { name: "平板支撑", type: "duration", description: "核心稳定训练" },
  { name: "引体向上", type: "sets", description: "背部拉力训练" },
  { name: "卷腹", type: "sets", description: "腹肌训练" },
  { name: "开合跳", type: "duration", description: "全身有氧热身" },
  { name: "跳绳", type: "duration", description: "全身协调有氧" },
];
