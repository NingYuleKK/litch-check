/**
 * 5 fixed task categories for Litch's Check.
 * Colors are chosen to be vibrant Memphis-style palette.
 */
export interface TaskType {
  id: number;
  name: string;
  color: string;       // Tailwind-friendly color class base
  bgColor: string;     // Background color for card
  textColor: string;   // Text color for card
  borderColor: string; // Border color
  emoji: string;       // Fallback emoji (used when iconUrl is not set)
  iconUrl?: string;    // Optional hand-drawn icon CDN URL (replaces emoji when set)
}

export const TASK_TYPES: TaskType[] = [
  {
    id: 1,
    name: "学英语",
    color: "mint",
    bgColor: "bg-[#A8E6CF]",
    textColor: "text-[#2D5F4A]",
    borderColor: "border-[#7BCBA2]",
    emoji: "📖",
    iconUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/86672527/qpUlQwmVKVYhLjFR.png"
  },
  {
    id: 2,
    name: "读书",
    color: "lavender",
    bgColor: "bg-[#C3B1E1]",
    textColor: "text-[#4A3670]",
    borderColor: "border-[#A48FCC]",
    emoji: "📚",
    iconUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/86672527/dZbAgILZfkqwacOC.png",
  },
  {
    id: 3,
    name: "AI / AIGC",
    color: "yellow",
    bgColor: "bg-[#FFEAA7]",
    textColor: "text-[#6B5B00]",
    borderColor: "border-[#F0D56E]",
    emoji: "🤖",
    iconUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/86672527/OmpVGKPjEPfQORGb.png",
  },
  {
    id: 4,
    name: "锻炼",
    color: "coral",
    bgColor: "bg-[#FFB7B2]",
    textColor: "text-[#8B3A36]",
    borderColor: "border-[#F09590]",
    emoji: "💪",
    iconUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/86672527/NLEYWWCLSTPqEeUP.png",
  },
  {
    id: 5,
    name: "功课与正念",
    color: "sky",
    bgColor: "bg-[#87CEEB]",
    textColor: "text-[#1A4A6B]",
    borderColor: "border-[#5FB8DB]",
    emoji: "🧘",
    iconUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/86672527/IYmwYYIMwVbiAFBj.png",
  },
];

export const TASK_MAP = Object.fromEntries(TASK_TYPES.map((t) => [t.id, t]));

/** Minimum completions for a star */
export const STAR_THRESHOLD = 3;
/** All tasks completed for lotus */
export const LOTUS_THRESHOLD = 5;
