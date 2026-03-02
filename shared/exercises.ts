/**
 * Exercise module types and preset data.
 * Defines exercise types, training records, and star/favorites system.
 */

/** A preset or user-created exercise type */
export interface ExerciseType {
  id: string;           // Unique identifier (slug)
  name: string;         // Display name
  imageUrl: string;     // Image path (local for V1)
  description: string;  // Short description
  isPreset: boolean;    // Whether this is a built-in preset
}

/** A single exercise entry within a training record */
export interface ExerciseEntry {
  exerciseId: string;   // References ExerciseType.id
  sets?: number;        // Number of sets (optional)
  duration?: string;    // Duration string e.g. "30分钟" (optional)
  note?: string;        // Additional note
}

/** A training record for a specific date */
export interface TrainingRecord {
  id?: number;
  dateStr: string;      // "YYYY-MM-DD"
  exercises: ExerciseEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

/** A starred (favorited) exercise or combo */
export interface StarredExercise {
  id?: number;
  exerciseId: string;
  starredAt?: Date;
}

/** Training record with resolved exercise info for display */
export interface TrainingRecordDisplay extends TrainingRecord {
  resolvedExercises: (ExerciseEntry & { exercise: ExerciseType })[];
}

// ─── Preset Exercises ─────────────────────────────────────────

export const PRESET_EXERCISES: ExerciseType[] = [
  {
    id: "kettlebell-swing",
    name: "壶铃摇摆",
    imageUrl: "/exercise-images/kettlebell-swing.png",
    description: "全身力量训练，锻炼臀部和核心",
    isPreset: true,
  },
  {
    id: "squat",
    name: "深蹲",
    imageUrl: "/exercise-images/squat.png",
    description: "下肢力量之王，强化腿部和臀部",
    isPreset: true,
  },
  {
    id: "dumbbell-press",
    name: "哑铃推举",
    imageUrl: "/exercise-images/dumbbell-press.png",
    description: "肩部和上肢力量训练",
    isPreset: true,
  },
  {
    id: "hula-hoop",
    name: "转呼啦圈",
    imageUrl: "/exercise-images/hula-hoop.png",
    description: "有趣的核心训练，燃脂好帮手",
    isPreset: true,
  },
  {
    id: "elliptical",
    name: "椭圆仪",
    imageUrl: "/exercise-images/elliptical.png",
    description: "低冲击有氧运动，保护关节",
    isPreset: true,
  },
  {
    id: "walking",
    name: "散步",
    imageUrl: "/exercise-images/walking.png",
    description: "最简单的运动，放松身心",
    isPreset: true,
  },
  {
    id: "foam-roller",
    name: "泡沫滚轴放松",
    imageUrl: "/exercise-images/foam-roller.png",
    description: "肌肉放松恢复，缓解酸痛",
    isPreset: true,
  },
  {
    id: "landmine-row",
    name: "炮筒划船",
    imageUrl: "/exercise-images/landmine-row.png",
    description: "背部力量训练，改善体态",
    isPreset: true,
  },
  {
    id: "tai-chi",
    name: "太极拳",
    imageUrl: "/exercise-images/tai-chi.png",
    description: "身心合一，柔中带刚",
    isPreset: true,
  },
];

export const PRESET_EXERCISE_MAP = Object.fromEntries(
  PRESET_EXERCISES.map((e) => [e.id, e])
);

/**
 * Get exercise by ID (from presets).
 * In V1, all exercises are presets. Future versions may support user-created exercises.
 */
export function getExerciseById(id: string): ExerciseType | undefined {
  return PRESET_EXERCISE_MAP[id];
}

/**
 * Get all available exercises (presets + user-created in future).
 */
export function getAllExercises(): ExerciseType[] {
  return [...PRESET_EXERCISES];
}
