import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Flower2, ChevronRight, Loader2, Clock, FileText } from "lucide-react";
import { CAT_IMAGES } from "../../../shared/catImages";
import { getThisWeekMonday, getWeekSunday, getWeeklyCommentCategory } from "../../../shared/weeklyReview";
import { motion, AnimatePresence } from "framer-motion";

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart + "T00:00:00");
  const e = new Date(weekEnd + "T00:00:00");
  const sMonth = s.getMonth() + 1;
  const eMonth = e.getMonth() + 1;
  if (sMonth === eMonth) {
    return `${sMonth}月${s.getDate()}日 - ${e.getDate()}日`;
  }
  return `${sMonth}月${s.getDate()}日 - ${eMonth}月${e.getDate()}日`;
}

function getRelativeWeekLabel(weekStart: string): string | null {
  const thisMonday = getThisWeekMonday();
  if (weekStart === thisMonday) return "本周";

  const lastMonday = new Date(thisMonday + "T00:00:00");
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastMondayStr = `${lastMonday.getFullYear()}-${String(lastMonday.getMonth() + 1).padStart(2, "0")}-${String(lastMonday.getDate()).padStart(2, "0")}`;
  if (weekStart === lastMondayStr) return "上周";

  return null;
}

export default function WeeklyReviews() {
  const { data: reviews, isLoading } = trpc.weeklyReview.list.useQuery(
    undefined,
    { refetchOnWindowFocus: false }
  );

  const thisWeekMonday = useMemo(() => getThisWeekMonday(), []);
  const thisWeekEnd = useMemo(() => getWeekSunday(thisWeekMonday), [thisWeekMonday]);

  // Check if current week is in the list (it might not be if no data yet)
  const hasCurrentWeek = reviews?.some((r) => r.weekStart === thisWeekMonday);

  return (
    <div className="container max-w-lg mx-auto py-6 pb-24">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-black tracking-tight">周报结算</h2>
        </div>
        <p className="text-xs text-muted-foreground font-bold">
          每周回顾，持续进步
        </p>
      </div>

      {/* Current week pending card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <Card className="border-2 border-dashed border-primary/30 bg-primary/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold">本周</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold uppercase tracking-wider">
                      进行中
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-bold">
                    {formatWeekRange(thisWeekMonday, thisWeekEnd)}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-bold">
                待结算
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!reviews || reviews.length === 0) && (
        <div className="text-center py-16">
          <img
            src={CAT_IMAGES.normal}
            alt="Cat"
            className="w-24 h-24 mx-auto mb-4 object-contain opacity-60"
          />
          <p className="font-bold text-muted-foreground">还没有历史周报</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            开始打卡后，每周一会自动生成结算单
          </p>
        </div>
      )}

      {/* Review list */}
      {reviews && reviews.length > 0 && (
        <div className="space-y-2.5">
          <AnimatePresence>
            {reviews.map((review, idx) => {
              const relLabel = getRelativeWeekLabel(review.weekStart);
              const isThisWeek = review.weekStart === thisWeekMonday;
              if (isThisWeek) return null; // Already shown above

              return (
                <motion.div
                  key={review.weekStart}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href={`/weekly-review/${review.weekStart}`}>
                    <Card className="border-2 border-black/5 shadow-sm hover:shadow-md hover:border-black/10 transition-all cursor-pointer active:scale-[0.98]">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Mini cat avatar */}
                            <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] flex items-center justify-center overflow-hidden">
                              <img
                                src={getCatImageForList(review.starDays, review.lotusDays)}
                                alt="Cat"
                                className="w-8 h-8 object-contain"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold">
                                  {formatWeekRange(review.weekStart, review.weekEnd)}
                                </span>
                                {relLabel && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-bold">
                                    {relLabel}
                                  </span>
                                )}
                              </div>
                              {/* Mini stats */}
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-bold">
                                  <Star className="w-3 h-3 text-[#F0D56E] fill-[#F0D56E]" />
                                  {review.starDays}天
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-bold">
                                  <Flower2 className="w-3 h-3 text-[#A48FCC]" />
                                  {review.lotusDays}天
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function getCatImageForList(starDays: number, lotusDays: number): string {
  const category = getWeeklyCommentCategory(starDays, lotusDays);
  switch (category) {
    case "perfect":
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
