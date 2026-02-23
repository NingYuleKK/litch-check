import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CAT_IMAGES } from "../../../shared/catImages";
import { isTodayMonday, getLastWeekMonday, getWeekSunday } from "../../../shared/weeklyReview";
import { Star, Flower2, FileText } from "lucide-react";

const REMINDER_STORAGE_KEY = "weekly-review-reminder-dismissed";

function getDismissKey(): string {
  // Key based on the Monday we're reminding about
  return `${REMINDER_STORAGE_KEY}-${getLastWeekMonday()}`;
}

export default function WeeklyReviewReminder() {
  const [, navigate] = useLocation();
  const [showReminder, setShowReminder] = useState(false);

  const isMonday = useMemo(() => isTodayMonday(), []);
  const lastWeekMonday = useMemo(() => getLastWeekMonday(), []);
  const lastWeekEnd = useMemo(() => getWeekSunday(lastWeekMonday), [lastWeekMonday]);

  // Fetch last week's review data for the popup preview
  const { data: reviewData } = trpc.weeklyReview.get.useQuery(
    { weekStart: lastWeekMonday },
    { enabled: isMonday && showReminder, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (!isMonday) return;

    // Check if already dismissed this week
    const dismissKey = getDismissKey();
    const dismissed = localStorage.getItem(dismissKey);
    if (!dismissed) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setShowReminder(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isMonday]);

  const handleDismiss = () => {
    localStorage.setItem(getDismissKey(), "true");
    setShowReminder(false);
  };

  const handleViewReview = () => {
    localStorage.setItem(getDismissKey(), "true");
    setShowReminder(false);
    navigate(`/weekly-review/${lastWeekMonday}`);
  };

  if (!isMonday || !showReminder) return null;

  const formatRange = () => {
    const s = new Date(lastWeekMonday + "T00:00:00");
    const e = new Date(lastWeekEnd + "T00:00:00");
    return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`;
  };

  return (
    <Dialog open={showReminder} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-sm rounded-3xl border-[3px] border-black/8 p-0 overflow-hidden">
        {/* Decorative top bar */}
        <div className="h-2 bg-gradient-to-r from-[#A8E6CF] via-[#FFEAA7] to-[#C3B1E1]" />

        <div className="p-6 text-center">
          {/* Cat image */}
          <img
            src={CAT_IMAGES.encourage}
            alt="Cat"
            className="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-md"
          />

          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight">
              上周周报来啦！
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground font-bold mt-2 mb-4">
            {formatRange()} 的结算单已生成
          </p>

          {/* Mini preview stats */}
          {reviewData && (
            <div className="flex items-center justify-center gap-4 mb-5 py-3 px-4 rounded-2xl bg-accent/50">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-[#F0D56E] fill-[#F0D56E]" />
                <span className="text-sm font-extrabold">{reviewData.starDays}天</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <Flower2 className="w-4 h-4 text-[#A48FCC]" />
                <span className="text-sm font-extrabold">{reviewData.lotusDays}天</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 font-bold border-2"
            >
              稍后再看
            </Button>
            <Button
              onClick={handleViewReview}
              className="flex-1 font-bold gap-1.5"
            >
              <FileText className="w-4 h-4" />
              查看周报
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
