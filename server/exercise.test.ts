/**
 * Exercise module tests.
 * Tests the exercise-related tRPC routes and database operations.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./exerciseDb", () => ({
  getTrainingRecordsByDate: vi.fn(),
  addTrainingRecord: vi.fn(),
  updateTrainingRecord: vi.fn(),
  deleteTrainingRecord: vi.fn(),
  getTrainingDates: vi.fn(),
  getExerciseStats: vi.fn(),
  getStarredExercises: vi.fn(),
  toggleStarExercise: vi.fn(),
}));

import {
  getTrainingRecordsByDate,
  addTrainingRecord,
  updateTrainingRecord,
  deleteTrainingRecord,
  getTrainingDates,
  getExerciseStats,
  getStarredExercises,
  toggleStarExercise,
} from "./exerciseDb";

import {
  PRESET_EXERCISES,
  getExerciseById,
  getAllExercises,
  PRESET_EXERCISE_MAP,
} from "../shared/exercises";

describe("Exercise Module - Shared Types", () => {
  it("should have 9 preset exercises", () => {
    expect(PRESET_EXERCISES).toHaveLength(9);
  });

  it("should have correct preset exercise IDs", () => {
    const ids = PRESET_EXERCISES.map((e) => e.id);
    expect(ids).toContain("kettlebell-swing");
    expect(ids).toContain("squat");
    expect(ids).toContain("dumbbell-press");
    expect(ids).toContain("hula-hoop");
    expect(ids).toContain("elliptical");
    expect(ids).toContain("walking");
    expect(ids).toContain("foam-roller");
    expect(ids).toContain("landmine-row");
    expect(ids).toContain("tai-chi");
  });

  it("should get exercise by ID", () => {
    const exercise = getExerciseById("kettlebell-swing");
    expect(exercise).toBeDefined();
    expect(exercise?.name).toBe("壶铃摇摆");
    expect(exercise?.isPreset).toBe(true);
  });

  it("should return undefined for unknown exercise ID", () => {
    const exercise = getExerciseById("unknown-exercise");
    expect(exercise).toBeUndefined();
  });

  it("should get all exercises", () => {
    const exercises = getAllExercises();
    expect(exercises).toHaveLength(9);
  });

  it("should have image URLs for all presets", () => {
    PRESET_EXERCISES.forEach((e) => {
      expect(e.imageUrl).toBeTruthy();
      expect(e.imageUrl).toMatch(/^\/exercise-images\//);
    });
  });

  it("should have descriptions for all presets", () => {
    PRESET_EXERCISES.forEach((e) => {
      expect(e.description).toBeTruthy();
      expect(e.description.length).toBeGreaterThan(0);
    });
  });

  it("should have correct PRESET_EXERCISE_MAP", () => {
    expect(Object.keys(PRESET_EXERCISE_MAP)).toHaveLength(9);
    expect(PRESET_EXERCISE_MAP["squat"]?.name).toBe("深蹲");
  });
});

describe("Exercise Module - Database Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get training records by date", async () => {
    const mockRecords = [
      {
        id: 1,
        dateStr: "2026-03-02",
        exerciseId: "kettlebell-swing",
        sets: 3,
        duration: null,
        note: "感觉不错",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(getTrainingRecordsByDate).mockResolvedValue(mockRecords);

    const result = await getTrainingRecordsByDate("2026-03-02");
    expect(result).toEqual(mockRecords);
    expect(getTrainingRecordsByDate).toHaveBeenCalledWith("2026-03-02");
  });

  it("should add a training record", async () => {
    vi.mocked(addTrainingRecord).mockResolvedValue({ id: 1 });

    const result = await addTrainingRecord({
      dateStr: "2026-03-02",
      exerciseId: "squat",
      sets: 5,
      duration: "20分钟",
      note: "腿有点酸",
    });

    expect(result).toEqual({ id: 1 });
    expect(addTrainingRecord).toHaveBeenCalledWith({
      dateStr: "2026-03-02",
      exerciseId: "squat",
      sets: 5,
      duration: "20分钟",
      note: "腿有点酸",
    });
  });

  it("should update a training record", async () => {
    vi.mocked(updateTrainingRecord).mockResolvedValue(undefined);

    await updateTrainingRecord({ id: 1, sets: 4, note: "更新备注" });
    expect(updateTrainingRecord).toHaveBeenCalledWith({
      id: 1,
      sets: 4,
      note: "更新备注",
    });
  });

  it("should delete a training record", async () => {
    vi.mocked(deleteTrainingRecord).mockResolvedValue(undefined);

    await deleteTrainingRecord(1);
    expect(deleteTrainingRecord).toHaveBeenCalledWith(1);
  });

  it("should get training dates", async () => {
    const mockDates = [
      { dateStr: "2026-03-02", exerciseCount: 3 },
      { dateStr: "2026-03-01", exerciseCount: 2 },
    ];
    vi.mocked(getTrainingDates).mockResolvedValue(mockDates);

    const result = await getTrainingDates();
    expect(result).toEqual(mockDates);
  });

  it("should get exercise stats", async () => {
    const mockStats = [
      { exerciseId: "squat", totalCount: 10, lastDate: "2026-03-02" },
      { exerciseId: "walking", totalCount: 5, lastDate: "2026-03-01" },
    ];
    vi.mocked(getExerciseStats).mockResolvedValue(mockStats);

    const result = await getExerciseStats();
    expect(result).toEqual(mockStats);
  });

  it("should get starred exercises", async () => {
    const mockStarred = [
      { id: 1, exerciseId: "squat", createdAt: new Date() },
      { id: 2, exerciseId: "walking", createdAt: new Date() },
    ];
    vi.mocked(getStarredExercises).mockResolvedValue(mockStarred);

    const result = await getStarredExercises();
    expect(result).toHaveLength(2);
  });

  it("should toggle star on", async () => {
    vi.mocked(toggleStarExercise).mockResolvedValue({ starred: true });

    const result = await toggleStarExercise("kettlebell-swing");
    expect(result).toEqual({ starred: true });
  });

  it("should toggle star off", async () => {
    vi.mocked(toggleStarExercise).mockResolvedValue({ starred: false });

    const result = await toggleStarExercise("kettlebell-swing");
    expect(result).toEqual({ starred: false });
  });
});
