import { useRef } from "react";
import { TASK_TYPES, TASK_MAP } from "../../../shared/tasks";
import { CAT_IMAGES } from "../../../shared/catImages";
import { getWeeklyCommentCategory } from "../../../shared/weeklyReview";
import type { WeeklyReviewData } from "../../../shared/weeklyReview";
import { motion } from "framer-motion";
import { Download, Star, Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeeklyReviewCardProps {
  data: WeeklyReviewData;
  onExport?: (element: HTMLDivElement) => void;
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart + "T00:00:00");
  const e = new Date(weekEnd + "T00:00:00");
  return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`;
}

/**
 * Get cat image based on weekly performance category.
 */
function getCatImageForWeek(starDays: number, lotusDays: number): string {
  const category = getWeeklyCommentCategory(starDays, lotusDays);
  switch (category) {
    case "perfect":
      return CAT_IMAGES.perfect;
    case "lotusMany":
      return CAT_IMAGES.perfect;
    case "decent":
      return CAT_IMAGES.encourage;
    case "slacking":
      return CAT_IMAGES.lazy;
    case "absent":
      return CAT_IMAGES.normal;
  }
}

export default function WeeklyReviewCard({ data, onExport }: WeeklyReviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const catImage = getCatImageForWeek(data.starDays, data.lotusDays);

  const handleExport = () => {
    if (cardRef.current && onExport) {
      onExport(cardRef.current);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
    >
      {/* Export button outside the card */}
      {onExport && (
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5 text-xs font-bold border-2 border-black/10 hover:border-black/20 bg-white/80"
          >
            <Download className="w-3.5 h-3.5" />
            导出图片
          </Button>
        </div>
      )}

      {/* The exportable card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl border-[3px] border-black/10 bg-gradient-to-br from-[#FFF5F0] via-white to-[#F0E6FF] shadow-lg"
        style={{ padding: "1.5rem" }}
      >
        {/* Memphis decorations */}
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full border-[3px] border-[#A8E6CF]/40 bg-[#A8E6CF]/15 pointer-events-none" />
        <div className="absolute -bottom-3 -left-3 w-16 h-16 border-[3px] border-[#FFEAA7]/40 bg-[#FFEAA7]/15 rotate-45 pointer-events-none" />
        <svg className="absolute top-4 left-4 w-8 h-8 pointer-events-none" viewBox="0 0 32 32">
          <polygon points="16,2 30,28 2,28" fill="none" stroke="rgba(195,177,225,0.4)" strokeWidth="2.5" />
          <polygon points="16,6 26,24 6,24" fill="rgba(195,177,225,0.15)" />
        </svg>
        <div className="absolute top-1/2 right-6 grid grid-cols-2 gap-1 pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#FFB7B2]/30" />
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 text-center mb-4">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Weekly Review
          </h3>
          <p className="text-xl font-black tracking-tight mt-0.5">
            {formatWeekRange(data.weekStart, data.weekEnd)}
          </p>
        </div>

        {/* Cat + Comment */}
        <div className="relative z-10 flex items-start gap-2 mb-5 justify-center">
          {/* Speech bubble */}
          <div className="relative max-w-[200px] mt-3">
            <div className="bg-white rounded-2xl rounded-br-sm px-3 py-2.5 shadow-sm border-2 border-black/6">
              <p className="text-[13px] font-bold leading-snug text-foreground/90">
                {data.catComment}
              </p>
            </div>
            <div className="absolute -right-1.5 bottom-3 w-3 h-3 bg-white border-r-2 border-b-2 border-black/6 rotate-[-45deg]" />
          </div>
          {/* Cat */}
          <img
            src={catImage}
            alt="司马黑"
            className="w-24 h-24 object-contain drop-shadow-md flex-shrink-0"
          />
        </div>

        {/* Star & Lotus Stats */}
        <div className="relative z-10 grid grid-cols-2 gap-3 mb-5">
          <div className="bg-[#FFEAA7]/30 rounded-2xl p-3 border-2 border-[#FFEAA7]/40 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Star className="w-4 h-4 text-[#F0D56E] fill-[#F0D56E]" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                星星天数
              </span>
            </div>
            <div className="text-3xl font-black tracking-tight">
              {data.starDays}
              <span className="text-sm font-bold text-muted-foreground">/7</span>
            </div>
          </div>
          <div className="bg-[#C3B1E1]/20 rounded-2xl p-3 border-2 border-[#C3B1E1]/30 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Flower2 className="w-4 h-4 text-[#A48FCC]" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                大圆满
              </span>
            </div>
            <div className="text-3xl font-black tracking-tight">
              {data.lotusDays}
              <span className="text-sm font-bold text-muted-foreground">/7</span>
            </div>
          </div>
        </div>

        {/* Per-task breakdown */}
        <div className="relative z-10 space-y-2">
          <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2">
            分类完成情况
          </h4>
          {data.taskStats.map((stat) => {
            const task = TASK_MAP[stat.taskId];
            if (!task) return null;
            const pct = Math.round((stat.completedDays / 7) * 100);
            return (
              <div key={stat.taskId} className="flex items-center gap-2.5">
                {/* Task icon */}
                <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                  {task.iconUrl ? (
                    <img
                      src={task.iconUrl}
                      alt={task.name}
                      className="w-5 h-5 object-contain"
                    />
                  ) : (
                    <span className="text-base">{task.emoji}</span>
                  )}
                </div>
                {/* Name */}
                <span className="text-xs font-bold w-16 truncate">{task.name}</span>
                {/* Progress bar */}
                <div className="flex-1 h-3 rounded-full bg-black/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className={`h-full rounded-full ${task.bgColor}`}
                  />
                </div>
                {/* Count */}
                <span className="text-xs font-extrabold w-8 text-right">
                  {stat.completedDays}/7
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer watermark */}
        <div className="relative z-10 mt-5 pt-3 border-t border-black/5 text-center">
          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
            Litch's Check
          </span>
        </div>
      </div>
    </motion.div>
  );
}
