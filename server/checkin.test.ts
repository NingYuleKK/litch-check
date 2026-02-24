import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for checkin and dailyLog tRPC procedures.
 * We mock the db module to avoid needing a real database connection.
 */

// Mock the db module
vi.mock("./db", () => {
  // In-memory store for test data
  const store: Map<string, { dateStr: string; taskId: number; completed: boolean; note: string | null; id: number; createdAt: Date; updatedAt: Date }> = new Map();
  const logStore: Map<string, { id: number; dateStr: string; content: string | null; createdAt: Date; updatedAt: Date }> = new Map();
  let nextId = 1;
  let nextLogId = 1;

  return {
    getCheckinsByDate: vi.fn(async (dateStr: string) => {
      return Array.from(store.values()).filter((c) => c.dateStr === dateStr);
    }),
    upsertCheckin: vi.fn(async (data: { dateStr: string; taskId: number; completed: boolean; note?: string | null }) => {
      const key = `${data.dateStr}-${data.taskId}`;
      const existing = store.get(key);
      if (existing) {
        existing.completed = data.completed;
        if (data.note !== undefined) existing.note = data.note ?? null;
        existing.updatedAt = new Date();
      } else {
        store.set(key, {
          id: nextId++,
          dateStr: data.dateStr,
          taskId: data.taskId,
          completed: data.completed,
          note: data.note ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }),
    updateCheckinNote: vi.fn(async (data: { dateStr: string; taskId: number; note: string }) => {
      const key = `${data.dateStr}-${data.taskId}`;
      const existing = store.get(key);
      if (existing) {
        existing.note = data.note;
        existing.updatedAt = new Date();
      } else {
        store.set(key, {
          id: nextId++,
          dateStr: data.dateStr,
          taskId: data.taskId,
          completed: false,
          note: data.note,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }),
    deleteCheckinNote: vi.fn(async (data: { dateStr: string; taskId: number }) => {
      const key = `${data.dateStr}-${data.taskId}`;
      const existing = store.get(key);
      if (existing) {
        existing.note = null;
        existing.updatedAt = new Date();
      }
    }),
    getMonthlySummary: vi.fn(async (year: number, month: number) => {
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      const dateMap = new Map<string, number>();
      for (const c of store.values()) {
        if (c.dateStr.startsWith(prefix) && c.completed) {
          dateMap.set(c.dateStr, (dateMap.get(c.dateStr) ?? 0) + 1);
        }
      }
      return Array.from(dateMap.entries()).map(([dateStr, completedCount]) => ({
        dateStr,
        completedCount,
      }));
    }),
    calculateStreak: vi.fn(async (todayStr: string) => {
      const dateMap = new Map<string, number>();
      for (const c of store.values()) {
        if (c.completed) {
          dateMap.set(c.dateStr, (dateMap.get(c.dateStr) ?? 0) + 1);
        }
      }
      let streak = 0;
      const current = new Date(todayStr + "T00:00:00Z");
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
    }),
    getDailyLog: vi.fn(async (dateStr: string) => {
      return logStore.get(dateStr) ?? null;
    }),
    upsertDailyLog: vi.fn(async (data: { dateStr: string; content: string }) => {
      const existing = logStore.get(data.dateStr);
      if (existing) {
        existing.content = data.content;
        existing.updatedAt = new Date();
      } else {
        logStore.set(data.dateStr, {
          id: nextLogId++,
          dateStr: data.dateStr,
          content: data.content,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }),
    getGptComment: vi.fn(async (dateStr: string) => {
      const log = logStore.get(dateStr);
      return log ? ((log as any).gptComment ?? null) : null;
    }),
    upsertGptComment: vi.fn(async (data: { dateStr: string; gptComment: string }) => {
      const existing = logStore.get(data.dateStr);
      if (existing) {
        (existing as any).gptComment = data.gptComment;
        existing.updatedAt = new Date();
      } else {
        logStore.set(data.dateStr, {
          id: nextLogId++,
          dateStr: data.dateStr,
          content: null,
          gptComment: data.gptComment,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }),
    // Keep original exports
    getDb: vi.fn(),
    upsertUser: vi.fn(),
    getUserByOpenId: vi.fn(),
  };
});

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("checkin.getByDate", () => {
  it("returns empty array for a date with no check-ins", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.checkin.getByDate({ dateStr: "2026-01-01" });
    expect(result).toEqual([]);
  });

  it("validates dateStr format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.checkin.getByDate({ dateStr: "invalid" })
    ).rejects.toThrow();
  });
});

describe("checkin.toggle", () => {
  it("creates a new check-in when toggling on", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.checkin.toggle({
      dateStr: "2026-02-22",
      taskId: 1,
      completed: true,
    });

    expect(result).toEqual({ success: true });

    const checkins = await caller.checkin.getByDate({ dateStr: "2026-02-22" });
    expect(checkins.length).toBeGreaterThanOrEqual(1);
    const found = checkins.find((c) => c.taskId === 1);
    expect(found).toBeDefined();
    expect(found?.completed).toBe(true);
  });

  it("rejects invalid taskId", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.checkin.toggle({ dateStr: "2026-02-22", taskId: 0, completed: true })
    ).rejects.toThrow();

    await expect(
      caller.checkin.toggle({ dateStr: "2026-02-22", taskId: 6, completed: true })
    ).rejects.toThrow();
  });

  it("toggles an existing check-in off", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.checkin.toggle({ dateStr: "2026-02-23", taskId: 2, completed: true });
    const result = await caller.checkin.toggle({ dateStr: "2026-02-23", taskId: 2, completed: false });
    expect(result).toEqual({ success: true });

    const checkins = await caller.checkin.getByDate({ dateStr: "2026-02-23" });
    const found = checkins.find((c) => c.taskId === 2);
    expect(found?.completed).toBe(false);
  });
});

describe("checkin.updateNote", () => {
  it("updates the note for a check-in", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.checkin.toggle({ dateStr: "2026-02-24", taskId: 3, completed: true });

    const result = await caller.checkin.updateNote({
      dateStr: "2026-02-24",
      taskId: 3,
      note: "学了 GPT-4 的新功能",
    });

    expect(result).toEqual({ success: true });

    const checkins = await caller.checkin.getByDate({ dateStr: "2026-02-24" });
    const found = checkins.find((c) => c.taskId === 3);
    expect(found?.note).toBe("学了 GPT-4 的新功能");
  });

  it("creates a record with note even if not yet completed", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.checkin.updateNote({
      dateStr: "2026-02-25",
      taskId: 4,
      note: "跑了5公里",
    });

    const checkins = await caller.checkin.getByDate({ dateStr: "2026-02-25" });
    const found = checkins.find((c) => c.taskId === 4);
    expect(found?.note).toBe("跑了5公里");
    expect(found?.completed).toBe(false);
  });
});

describe("checkin.deleteNote", () => {
  it("clears the note for a check-in", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Create a check-in with a note
    await caller.checkin.toggle({ dateStr: "2026-02-26", taskId: 1, completed: true });
    await caller.checkin.updateNote({ dateStr: "2026-02-26", taskId: 1, note: "Test note" });

    // Delete the note
    const result = await caller.checkin.deleteNote({ dateStr: "2026-02-26", taskId: 1 });
    expect(result).toEqual({ success: true });

    // Verify note is cleared
    const checkins = await caller.checkin.getByDate({ dateStr: "2026-02-26" });
    const found = checkins.find((c) => c.taskId === 1);
    expect(found?.note).toBeNull();
  });

  it("succeeds even if no note exists", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.checkin.deleteNote({ dateStr: "2026-03-15", taskId: 3 });
    expect(result).toEqual({ success: true });
  });

  it("validates input", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.checkin.deleteNote({ dateStr: "bad-date", taskId: 1 })
    ).rejects.toThrow();

    await expect(
      caller.checkin.deleteNote({ dateStr: "2026-02-26", taskId: 6 })
    ).rejects.toThrow();
  });
});

describe("checkin.monthlySummary", () => {
  it("returns summary for a month with data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    for (let taskId = 1; taskId <= 5; taskId++) {
      await caller.checkin.toggle({ dateStr: "2026-02-20", taskId, completed: true });
    }

    const summary = await caller.checkin.monthlySummary({ year: 2026, month: 2 });
    const feb20 = summary.find((s) => s.dateStr === "2026-02-20");
    expect(feb20).toBeDefined();
    expect(feb20?.completedCount).toBe(5);
  });

  it("validates month range", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.checkin.monthlySummary({ year: 2026, month: 0 })
    ).rejects.toThrow();

    await expect(
      caller.checkin.monthlySummary({ year: 2026, month: 13 })
    ).rejects.toThrow();
  });
});

describe("checkin.streak", () => {
  it("returns 0 for no data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.checkin.streak({ todayStr: "2026-03-01" });
    expect(result.streak).toBe(0);
  });

  it("calculates streak correctly", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    for (const date of ["2026-02-18", "2026-02-19", "2026-02-20"]) {
      for (let taskId = 1; taskId <= 3; taskId++) {
        await caller.checkin.toggle({ dateStr: date, taskId, completed: true });
      }
    }

    const result = await caller.checkin.streak({ todayStr: "2026-02-20" });
    expect(result.streak).toBeGreaterThanOrEqual(1);
  });
});

describe("dailyLog", () => {
  it("returns null for a date with no log", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dailyLog.get({ dateStr: "2026-01-01" });
    expect(result).toBeNull();
  });

  it("saves and retrieves a daily log", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const saveResult = await caller.dailyLog.save({
      dateStr: "2026-02-23",
      content: "今天是美好的一天，完成了很多事情！",
    });
    expect(saveResult).toEqual({ success: true });

    const log = await caller.dailyLog.get({ dateStr: "2026-02-23" });
    expect(log).toBeDefined();
    expect(log?.content).toBe("今天是美好的一天，完成了很多事情！");
  });

  it("updates an existing daily log", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.dailyLog.save({
      dateStr: "2026-02-24",
      content: "初始内容",
    });

    await caller.dailyLog.save({
      dateStr: "2026-02-24",
      content: "更新后的内容",
    });

    const log = await caller.dailyLog.get({ dateStr: "2026-02-24" });
    expect(log?.content).toBe("更新后的内容");
  });

  it("validates dateStr format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.dailyLog.get({ dateStr: "invalid" })
    ).rejects.toThrow();

    await expect(
      caller.dailyLog.save({ dateStr: "bad", content: "test" })
    ).rejects.toThrow();
  });
});

describe("gptComment", () => {
  it("returns null gptComment for a date with no comment", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.gptComment.get({ dateStr: "2026-01-01" });
    expect(result.gptComment).toBeNull();
  });

  it("saves and retrieves a GPT comment", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const saveResult = await caller.gptComment.save({
      dateStr: "2026-02-28",
      gptComment: "今天表现不错，继续保持！",
    });
    expect(saveResult).toEqual({ success: true });

    const result = await caller.gptComment.get({ dateStr: "2026-02-28" });
    expect(result.gptComment).toBe("今天表现不错，继续保持！");
  });

  it("updates an existing GPT comment", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.gptComment.save({
      dateStr: "2026-03-01",
      gptComment: "初始批语",
    });

    await caller.gptComment.save({
      dateStr: "2026-03-01",
      gptComment: "更新后的批语",
    });

    const result = await caller.gptComment.get({ dateStr: "2026-03-01" });
    expect(result.gptComment).toBe("更新后的批语");
  });

  it("validates dateStr format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.gptComment.get({ dateStr: "invalid" })
    ).rejects.toThrow();

    await expect(
      caller.gptComment.save({ dateStr: "bad", gptComment: "test" })
    ).rejects.toThrow();
  });
});
