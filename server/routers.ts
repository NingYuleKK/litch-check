import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getCheckinsByDate,
  upsertCheckin,
  updateCheckinNote,
  deleteCheckinNote,
  getMonthlySummary,
  calculateStreak,
  getDailyLog,
  upsertDailyLog,
  getGptComment,
  upsertGptComment,
  getWeeklyReview,
  getWeeklyReviews,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  checkin: router({
    /** Get all check-ins for a specific date */
    getByDate: publicProcedure
      .input(z.object({ dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => {
        return getCheckinsByDate(input.dateStr);
      }),

    /** Toggle a task's completion status */
    toggle: publicProcedure
      .input(
        z.object({
          dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          taskId: z.number().min(1).max(5),
          completed: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        await upsertCheckin({
          dateStr: input.dateStr,
          taskId: input.taskId,
          completed: input.completed,
        });
        return { success: true };
      }),

    /** Update the note for a task */
    updateNote: publicProcedure
      .input(
        z.object({
          dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          taskId: z.number().min(1).max(5),
          note: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await updateCheckinNote({
          dateStr: input.dateStr,
          taskId: input.taskId,
          note: input.note,
        });
        return { success: true };
      }),

    /** Delete (clear) the note for a task */
    deleteNote: publicProcedure
      .input(
        z.object({
          dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          taskId: z.number().min(1).max(5),
        })
      )
      .mutation(async ({ input }) => {
        await deleteCheckinNote({
          dateStr: input.dateStr,
          taskId: input.taskId,
        });
        return { success: true };
      }),

    /** Get monthly summary for calendar view */
    monthlySummary: publicProcedure
      .input(
        z.object({
          year: z.number(),
          month: z.number().min(1).max(12),
        })
      )
      .query(async ({ input }) => {
        return getMonthlySummary(input.year, input.month);
      }),

    /** Get current streak count */
    streak: publicProcedure
      .input(z.object({ todayStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => {
        const streak = await calculateStreak(input.todayStr);
        return { streak };
      }),
  }),

  weeklyReview: router({
    /** Get weekly review for a specific week (weekStart = Monday date) */
    get: publicProcedure
      .input(z.object({ weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => {
        return getWeeklyReview(input.weekStart);
      }),

    /** Get list of all available weekly reviews */
    list: publicProcedure.query(async () => {
      return getWeeklyReviews();
    }),
  }),

  dailyLog: router({
    /** Get daily log for a specific date */
    get: publicProcedure
      .input(z.object({ dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => {
        return getDailyLog(input.dateStr);
      }),

    /** Save/update daily log content */
    save: publicProcedure
      .input(
        z.object({
          dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await upsertDailyLog({
          dateStr: input.dateStr,
          content: input.content,
        });
        return { success: true };
      }),
  }),

  gptComment: router({
    /** Get GPT comment for a specific date */
    get: publicProcedure
      .input(z.object({ dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => {
        const comment = await getGptComment(input.dateStr);
        return { gptComment: comment };
      }),

    /** Save/update GPT comment for a specific date */
    save: publicProcedure
      .input(
        z.object({
          dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          gptComment: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await upsertGptComment({
          dateStr: input.dateStr,
          gptComment: input.gptComment,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
