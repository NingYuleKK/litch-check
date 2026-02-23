import { describe, expect, it } from "vitest";
import {
  getWeeklyCommentCategory,
  getWeeklyCatComment,
  getWeekMonday,
  getWeekSunday,
  generateWeekStarts,
  getLastWeekMonday,
  getThisWeekMonday,
} from "../shared/weeklyReview";

describe("weeklyReview shared logic", () => {
  describe("getWeeklyCommentCategory", () => {
    it("returns 'perfect' when all 7 days have ≥3 completions", () => {
      expect(getWeeklyCommentCategory(7, 0)).toBe("perfect");
      expect(getWeeklyCommentCategory(7, 7)).toBe("perfect");
    });

    it("returns 'lotusMany' when ≥3 days have all 5 completions (but not 7-day star)", () => {
      expect(getWeeklyCommentCategory(3, 3)).toBe("lotusMany");
      expect(getWeeklyCommentCategory(5, 4)).toBe("lotusMany");
    });

    it("returns 'decent' when 4-6 days have ≥3 completions", () => {
      expect(getWeeklyCommentCategory(4, 0)).toBe("decent");
      expect(getWeeklyCommentCategory(5, 1)).toBe("decent");
      expect(getWeeklyCommentCategory(6, 2)).toBe("decent");
    });

    it("returns 'slacking' when 1-3 days have ≥3 completions", () => {
      expect(getWeeklyCommentCategory(1, 0)).toBe("slacking");
      expect(getWeeklyCommentCategory(2, 0)).toBe("slacking");
      expect(getWeeklyCommentCategory(3, 0)).toBe("slacking");
    });

    it("returns 'absent' when 0 days have ≥3 completions", () => {
      expect(getWeeklyCommentCategory(0, 0)).toBe("absent");
    });
  });

  describe("getWeeklyCatComment", () => {
    it("returns a string comment", () => {
      const comment = getWeeklyCatComment(7, 0, "2026-02-16");
      expect(typeof comment).toBe("string");
      expect(comment.length).toBeGreaterThan(0);
    });

    it("returns deterministic comment for same inputs", () => {
      const c1 = getWeeklyCatComment(3, 1, "2026-02-16");
      const c2 = getWeeklyCatComment(3, 1, "2026-02-16");
      expect(c1).toBe(c2);
    });

    it("may return different comments for different weeks", () => {
      // Not guaranteed to be different, but at least both should be valid strings
      const c1 = getWeeklyCatComment(0, 0, "2026-02-09");
      const c2 = getWeeklyCatComment(0, 0, "2026-02-16");
      expect(typeof c1).toBe("string");
      expect(typeof c2).toBe("string");
    });
  });

  describe("getWeekMonday", () => {
    it("returns Monday for a Monday input", () => {
      expect(getWeekMonday("2026-02-16")).toBe("2026-02-16"); // Monday
    });

    it("returns Monday for a Wednesday input", () => {
      expect(getWeekMonday("2026-02-18")).toBe("2026-02-16"); // Wednesday → Monday
    });

    it("returns Monday for a Sunday input", () => {
      expect(getWeekMonday("2026-02-22")).toBe("2026-02-16"); // Sunday → Monday
    });

    it("returns Monday for a Saturday input", () => {
      expect(getWeekMonday("2026-02-21")).toBe("2026-02-16"); // Saturday → Monday
    });
  });

  describe("getWeekSunday", () => {
    it("returns Sunday for a Monday input", () => {
      expect(getWeekSunday("2026-02-16")).toBe("2026-02-22");
    });

    it("returns correct Sunday for another Monday", () => {
      expect(getWeekSunday("2026-02-23")).toBe("2026-03-01");
    });
  });

  describe("generateWeekStarts", () => {
    it("generates week starts from earliest to latest (reversed)", () => {
      const weeks = generateWeekStarts("2026-02-01", "2026-02-28");
      expect(weeks.length).toBeGreaterThan(0);
      // Should be in reverse chronological order
      for (let i = 1; i < weeks.length; i++) {
        expect(weeks[i]! < weeks[i - 1]!).toBe(true);
      }
    });

    it("returns at least one week for same-week dates", () => {
      const weeks = generateWeekStarts("2026-02-16", "2026-02-18");
      expect(weeks.length).toBe(1);
      expect(weeks[0]).toBe("2026-02-16");
    });

    it("handles cross-month boundaries", () => {
      const weeks = generateWeekStarts("2026-01-28", "2026-02-05");
      expect(weeks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getThisWeekMonday", () => {
    it("returns a valid date string", () => {
      const monday = getThisWeekMonday();
      expect(monday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getLastWeekMonday", () => {
    it("returns a date before this week's Monday", () => {
      const lastMonday = getLastWeekMonday();
      const thisMonday = getThisWeekMonday();
      expect(lastMonday < thisMonday).toBe(true);
    });

    it("returns a date exactly 7 days before this week's Monday", () => {
      const lastMonday = getLastWeekMonday();
      const thisMonday = getThisWeekMonday();
      const diff =
        new Date(thisMonday + "T00:00:00").getTime() -
        new Date(lastMonday + "T00:00:00").getTime();
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });
});
