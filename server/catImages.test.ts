import { describe, expect, it } from "vitest";
import {
  getCatState,
  getCatDialogue,
  getStreakMessage,
  CAT_IMAGES,
  CAT_DIALOGUES,
  STREAK_MESSAGES,
} from "../shared/catImages";

describe("getCatState", () => {
  it("returns 'normal' for 0 completions", () => {
    expect(getCatState(0)).toBe("normal");
  });

  it("returns 'lazy' for 1-2 completions", () => {
    expect(getCatState(1)).toBe("lazy");
    expect(getCatState(2)).toBe("lazy");
  });

  it("returns 'encourage' for 3-4 completions", () => {
    expect(getCatState(3)).toBe("encourage");
    expect(getCatState(4)).toBe("encourage");
  });

  it("returns 'perfect' for 5 completions", () => {
    expect(getCatState(5)).toBe("perfect");
  });
});

describe("CAT_IMAGES", () => {
  it("has all 4 states with CDN URLs", () => {
    expect(CAT_IMAGES.normal).toContain("https://");
    expect(CAT_IMAGES.encourage).toContain("https://");
    expect(CAT_IMAGES.perfect).toContain("https://");
    expect(CAT_IMAGES.lazy).toContain("https://");
  });
});

describe("CAT_DIALOGUES", () => {
  it("has dialogues for all states", () => {
    expect(CAT_DIALOGUES.normal.length).toBeGreaterThanOrEqual(4);
    expect(CAT_DIALOGUES.lazy.length).toBeGreaterThanOrEqual(3);
    expect(CAT_DIALOGUES.encourage.length).toBeGreaterThanOrEqual(2);
    expect(CAT_DIALOGUES.perfect.length).toBeGreaterThanOrEqual(3);
  });

  it("all dialogues are non-empty strings", () => {
    for (const state of Object.keys(CAT_DIALOGUES) as Array<keyof typeof CAT_DIALOGUES>) {
      for (const line of CAT_DIALOGUES[state]) {
        expect(typeof line).toBe("string");
        expect(line.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("getCatDialogue", () => {
  it("returns a string from the correct state pool", () => {
    const dialogue0 = getCatDialogue(0, "2026-02-23");
    expect(CAT_DIALOGUES.normal).toContain(dialogue0);

    const dialogue1 = getCatDialogue(1, "2026-02-23");
    expect(CAT_DIALOGUES.lazy).toContain(dialogue1);

    const dialogue3 = getCatDialogue(3, "2026-02-23");
    expect(CAT_DIALOGUES.encourage).toContain(dialogue3);

    const dialogue5 = getCatDialogue(5, "2026-02-23");
    expect(CAT_DIALOGUES.perfect).toContain(dialogue5);
  });

  it("returns consistent result for same date and count", () => {
    const a = getCatDialogue(3, "2026-02-23");
    const b = getCatDialogue(3, "2026-02-23");
    expect(a).toBe(b);
  });

  it("may return different result for different dates", () => {
    // Not guaranteed to be different, but should be deterministic per date
    const a = getCatDialogue(0, "2026-02-23");
    const b = getCatDialogue(0, "2026-02-24");
    expect(typeof a).toBe("string");
    expect(typeof b).toBe("string");
  });

  it("changes dialogue when completedCount changes", () => {
    const a = getCatDialogue(0, "2026-02-23");
    const b = getCatDialogue(3, "2026-02-23");
    // Different states, so different pool
    expect(CAT_DIALOGUES.normal).toContain(a);
    expect(CAT_DIALOGUES.encourage).toContain(b);
  });
});

describe("getStreakMessage", () => {
  it("returns null for streak < 3", () => {
    expect(getStreakMessage(0)).toBeNull();
    expect(getStreakMessage(1)).toBeNull();
    expect(getStreakMessage(2)).toBeNull();
  });

  it("returns 3-day message for streak 3-6", () => {
    const msg = getStreakMessage(3);
    expect(msg).toBe("三天了，开始有点意思。😏");
    expect(getStreakMessage(6)).toBe("三天了，开始有点意思。😏");
  });

  it("returns 7-day message for streak 7-13", () => {
    const msg = getStreakMessage(7);
    expect(msg).toBe("一周了，太厉害了！💪");
    expect(getStreakMessage(13)).toBe("一周了，太厉害了！💪");
  });

  it("returns 14-day message for streak 14-29", () => {
    const msg = getStreakMessage(14);
    expect(msg).toBe("两周连胜，你是机器人吗？🤖");
    expect(getStreakMessage(29)).toBe("两周连胜，你是机器人吗？🤖");
  });

  it("returns 30-day message for streak >= 30", () => {
    const msg = getStreakMessage(30);
    expect(msg).toBe("一个月！本猫跪了。🙇");
    expect(getStreakMessage(100)).toBe("一个月！本猫跪了。🙇");
  });
});
