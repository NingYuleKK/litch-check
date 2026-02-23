/**
 * Weekly Review types and cat commentary logic.
 */
import { TASK_TYPES } from "./tasks";

/** Per-task weekly stats */
export interface TaskWeeklyStat {
  taskId: number;
  taskName: string;
  completedDays: number; // out of 7
}

/** Full weekly review data */
export interface WeeklyReviewData {
  weekStart: string; // "YYYY-MM-DD" (Monday)
  weekEnd: string;   // "YYYY-MM-DD" (Sunday)
  starDays: number;  // days with ≥3 completions
  lotusDays: number; // days with all 5 completions
  taskStats: TaskWeeklyStat[];
  totalCompletions: number; // sum of all task completions across the week
  catComment: string; // sassy cat commentary
}

/** Summary item for the weekly reviews list */
export interface WeeklyReviewListItem {
  weekStart: string;
  weekEnd: string;
  starDays: number;
  lotusDays: number;
  totalCompletions: number;
}

// ─── Cat Commentary Logic ──────────────────────────────────────

/**
 * Generate a sassy cat comment based on weekly performance.
 * Rules:
 * - 全勤周（7天都≥3）: super impressed
 * - 大圆满多（≥3天 all 5）: lotus jokes
 * - 一般般（4-5天≥3）: lukewarm praise
 * - 摸鱼周（≤3天≥3）: disappointed
 * - 完全没打卡（0天≥3）: existential concern
 */
const CAT_WEEKLY_COMMENTS = {
  perfect: [
    "这周你比我还勤快，不科学。",
    "七天全勤？你是不是偷偷给自己打了鸡血？",
    "本猫决定这周不嘲笑你了……才怪。",
  ],
  lotusMany: [
    "莲花都快被你摘完了，佛祖要找你谈话。",
    "大圆满达人！你是来卷本猫的吗？",
    "这么多莲花，你是想成佛还是想成猫？",
  ],
  decent: [
    "还行吧，勉强配得上我的陪伴。",
    "中规中矩，本猫给你打个及格分。",
    "不好不坏，就像我今天的午觉一样。",
  ],
  slacking: [
    "这周你是不是把我忘了？",
    "摸鱼摸得挺开心的嘛，本猫看在眼里。",
    "下周再这样，本猫要离家出走了。",
  ],
  absent: [
    "……你还活着吗？",
    "本猫已经开始怀疑你是不是换了一只猫。",
    "一整周没见你，本猫的猫粮都快吃完了。",
  ],
} as const;

type CommentCategory = keyof typeof CAT_WEEKLY_COMMENTS;

/**
 * Determine comment category based on weekly stats.
 */
export function getWeeklyCommentCategory(
  starDays: number,
  lotusDays: number
): CommentCategory {
  if (starDays >= 7) return "perfect";
  if (lotusDays >= 3) return "lotusMany";
  if (starDays >= 4) return "decent";
  if (starDays >= 1) return "slacking";
  return "absent";
}

/**
 * Pick a cat comment based on weekly performance.
 * Uses weekStart as seed for deterministic selection.
 */
export function getWeeklyCatComment(
  starDays: number,
  lotusDays: number,
  weekStart: string
): string {
  const category = getWeeklyCommentCategory(starDays, lotusDays);
  const comments = CAT_WEEKLY_COMMENTS[category];
  const seed = hashCode(weekStart + category);
  const index = Math.abs(seed) % comments.length;
  return comments[index];
}

/**
 * Get the Monday (start) of the week containing the given date.
 * Returns "YYYY-MM-DD" format.
 */
export function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

/**
 * Get the Sunday (end) of the week starting on the given Monday.
 */
export function getWeekSunday(mondayStr: string): string {
  const d = new Date(mondayStr + "T00:00:00");
  d.setDate(d.getDate() + 6);
  return formatDate(d);
}

/**
 * Get all week start dates (Mondays) from the earliest checkin to now.
 * Used for generating the list of available weekly reviews.
 */
export function generateWeekStarts(
  earliestDate: string,
  latestDate: string
): string[] {
  const weeks: string[] = [];
  let current = getWeekMonday(earliestDate);
  const lastMonday = getWeekMonday(latestDate);

  while (current <= lastMonday) {
    weeks.push(current);
    const d = new Date(current + "T00:00:00");
    d.setDate(d.getDate() + 7);
    current = formatDate(d);
  }

  return weeks.reverse(); // Most recent first
}

/**
 * Check if today is Monday (for popup reminder).
 */
export function isTodayMonday(): boolean {
  return new Date().getDay() === 1;
}

/**
 * Get last week's Monday date string.
 */
export function getLastWeekMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -13 : -6 - day; // Go back to last Monday
  today.setDate(today.getDate() + diff);
  return formatDate(today);
}

/**
 * Get this week's Monday date string.
 */
export function getThisWeekMonday(): string {
  return getWeekMonday(formatDate(new Date()));
}

// ─── Helpers ───────────────────────────────────────────────────

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}
