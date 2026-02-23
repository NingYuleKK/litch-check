import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { domToBlob } from "modern-screenshot";
import { trpc } from "@/lib/trpc";
import { TASK_TYPES, TASK_MAP, STAR_THRESHOLD, LOTUS_THRESHOLD, type TaskType } from "../../../shared/tasks";
import { CAT_IMAGES, getCatState } from "../../../shared/catImages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Flame, Pencil, Trash2, Check, X, BarChart3, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ─── Task Icon Component ──────────────────────────────────────
function TaskIcon({ task, size = "base" }: { task: TaskType; size?: "sm" | "base" }) {
  if (task.iconUrl) {
    return (
      <img
        src={task.iconUrl}
        alt={task.name}
        className={size === "sm" ? "w-4 h-4 object-contain" : "w-5 h-5 object-contain"}
      />
    );
  }
  return <span className={size === "sm" ? "text-sm" : "text-base"}>{task.emoji}</span>;
}

export default function CalendarView() {
  const today = useMemo(getTodayStr, []);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: summary } = trpc.checkin.monthlySummary.useQuery(
    { year, month },
    { refetchOnWindowFocus: false }
  );

  const { data: streakData } = trpc.checkin.streak.useQuery(
    { todayStr: today },
    { refetchOnWindowFocus: false }
  );

  const streak = streakData?.streak ?? 0;

  const dayMap = useMemo(() => {
    const map = new Map<string, number>();
    if (summary) {
      for (const s of summary) {
        map.set(s.dateStr, s.completedCount);
      }
    }
    return map;
  }, [summary]);

  // ─── Weekly Stats Calculation ─────────────────────────────────
  const weeklyStats = useMemo(() => {
    const lastDay = new Date(year, month, 0);
    const totalDays = lastDay.getDate();

    // Group days into weeks (Mon-Sun)
    const weeks: { label: string; days: string[]; completed: number; total: number; rate: number }[] = [];
    let weekStart = 1;

    while (weekStart <= totalDays) {
      const startDate = new Date(year, month - 1, weekStart);
      // Find end of this week (Sunday) or end of month
      const daysUntilSunday = (7 - startDate.getDay()) % 7;
      const weekEnd = Math.min(weekStart + daysUntilSunday, totalDays);

      const days: string[] = [];
      let weekCompleted = 0;
      let weekTotal = 0;

      for (let d = weekStart; d <= weekEnd; d++) {
        const ds = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        // Only count days up to today
        if (ds <= today) {
          days.push(ds);
          const count = dayMap.get(ds) ?? 0;
          weekCompleted += count;
          weekTotal += LOTUS_THRESHOLD; // 5 tasks per day
        }
      }

      if (days.length > 0) {
        const rate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
        weeks.push({
          label: `${weekStart}-${weekEnd}日`,
          days,
          completed: weekCompleted,
          total: weekTotal,
          rate,
        });
      }

      weekStart = weekEnd + 1;
    }

    return weeks;
  }, [year, month, dayMap, today]);

  // Monthly totals
  const monthlyStats = useMemo(() => {
    let totalCompleted = 0;
    let totalDays = 0;
    let starDays = 0;
    let lotusDays = 0;

    dayMap.forEach((count, ds) => {
      // Only count current month
      if (ds.startsWith(`${year}-${String(month).padStart(2, "0")}`)) {
        totalCompleted += count;
        totalDays++;
        if (count >= STAR_THRESHOLD) starDays++;
        if (count >= LOTUS_THRESHOLD) lotusDays++;
      }
    });

    return { totalCompleted, totalDays, starDays, lotusDays };
  }, [dayMap, year, month]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { date: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    const prevMonthLast = new Date(year, month - 1, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevMonthLast - i;
      const m = month - 1 < 1 ? 12 : month - 1;
      const y = month - 1 < 1 ? year - 1 : year;
      days.push({
        date: d,
        dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    for (let d = 1; d <= totalDays; d++) {
      days.push({
        date: d,
        dateStr: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: true,
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = month + 1 > 12 ? 1 : month + 1;
      const y = month + 1 > 12 ? year + 1 : year;
      days.push({
        date: d,
        dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const goToPrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthNames = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月",
  ];

  return (
    <div className="container max-w-lg mx-auto py-6 pb-24">
      {/* Streak banner */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#FFB7B2]/30 to-[#FFEAA7]/30 border-2 border-black/5"
        >
          <div className="flex items-center justify-center gap-3">
            <Flame className="w-6 h-6 text-[#FF6B6B]" />
            <div className="text-center">
              <div className="font-extrabold text-2xl tracking-tight">{streak}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                天连胜
              </div>
            </div>
            <Flame className="w-6 h-6 text-[#FF6B6B]" />
          </div>
        </motion.div>
      )}

      {/* Month navigation */}
      <Card className="border-2 border-black/5 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-xl font-extrabold tracking-tight">
              {year}年 {monthNames[month - 1]}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={goToNextMonth} className="rounded-full">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-2 pb-3">
          <div className="grid grid-cols-7 mb-1">
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-bold text-muted-foreground py-2"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, idx) => {
              const count = dayMap.get(day.dateStr) ?? 0;
              const isLotus = count >= LOTUS_THRESHOLD;
              const isStar = count >= STAR_THRESHOLD && !isLotus;
              const isToday = day.dateStr === today;
              const isFuture = day.dateStr > today;

              let bgClass = "";
              if (day.isCurrentMonth && isLotus) {
                bgClass = "bg-gradient-to-br from-[#C3B1E1]/50 to-[#FFB7B2]/50";
              } else if (day.isCurrentMonth && isStar) {
                bgClass = "bg-[#FFEAA7]/50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (day.isCurrentMonth && !isFuture) {
                      setSelectedDate(day.dateStr);
                    }
                  }}
                  disabled={!day.isCurrentMonth || isFuture}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all
                    ${!day.isCurrentMonth ? "opacity-15" : ""}
                    ${isFuture && day.isCurrentMonth ? "opacity-30" : ""}
                    ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
                    ${bgClass}
                    ${day.isCurrentMonth && !isFuture && !bgClass ? "hover:bg-secondary/60 active:scale-95" : ""}
                  `}
                >
                  <span className={`font-bold text-[13px] ${isToday ? "text-primary" : ""}`}>
                    {day.date}
                  </span>
                  {isLotus && (
                    <span className="text-[10px] leading-none">🪷</span>
                  )}
                  {isStar && (
                    <span className="text-[10px] leading-none">⭐</span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#FFEAA7]/60" />
          <span>⭐ ≥3个</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-[#C3B1E1]/60 to-[#FFB7B2]/60" />
          <span>🪷 全部完成</span>
        </div>
      </div>

      {/* Weekly Stats Chart */}
      <Card className="mt-6 border-2 border-black/5 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-extrabold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#C3B1E1]" />
            每周完成率
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {weeklyStats.length === 0 ? (
            <div className="text-xs text-muted-foreground/50 text-center py-4">
              本月暂无数据
            </div>
          ) : (
            <div className="space-y-3">
              {weeklyStats.map((week, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-muted-foreground w-16 text-right shrink-0">
                    {week.label}
                  </span>
                  <div className="flex-1 h-6 bg-secondary/40 rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${week.rate}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        week.rate >= 80
                          ? "bg-gradient-to-r from-[#A8E6CF] to-[#7BCBA2]"
                          : week.rate >= 60
                          ? "bg-gradient-to-r from-[#FFEAA7] to-[#F0D56E]"
                          : week.rate >= 40
                          ? "bg-gradient-to-r from-[#FFB7B2] to-[#F09590]"
                          : "bg-gradient-to-r from-[#FFB7B2]/60 to-[#F09590]/60"
                      }`}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-foreground/70">
                      {week.rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <Card className="border-2 border-black/5 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-extrabold text-foreground">{monthlyStats.totalCompleted}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              总完成数
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-black/5 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-extrabold text-[#F0D56E]">{monthlyStats.starDays}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              ⭐ 星星天
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-black/5 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-extrabold text-[#C3B1E1]">{monthlyStats.lotusDays}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              🪷 圆满天
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day detail dialog */}
      <DayDetailDialog
        dateStr={selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}

// ─── Day Detail Dialog with Edit/Delete ─────────────────────────

function DayDetailDialog({
  dateStr,
  onClose,
}: {
  dateStr: string | null;
  onClose: () => void;
}) {
  const { data: checkins, isLoading } = trpc.checkin.getByDate.useQuery(
    { dateStr: dateStr ?? "" },
    { enabled: !!dateStr, refetchOnWindowFocus: false }
  );

  const { data: dailyLog } = trpc.dailyLog.get.useQuery(
    { dateStr: dateStr ?? "" },
    { enabled: !!dateStr, refetchOnWindowFocus: false }
  );

  const utils = trpc.useUtils();
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const updateNoteMutation = trpc.checkin.updateNote.useMutation({
    onSuccess: () => {
      if (dateStr) utils.checkin.getByDate.invalidate({ dateStr });
      toast.success("记录已更新");
    },
  });

  const deleteNoteMutation = trpc.checkin.deleteNote.useMutation({
    onSuccess: () => {
      if (dateStr) utils.checkin.getByDate.invalidate({ dateStr });
      toast.success("记录已删除");
    },
  });

  const completedCount = checkins?.filter((c) => c.completed).length ?? 0;
  const isLotus = completedCount >= LOTUS_THRESHOLD;
  const isStar = completedCount >= STAR_THRESHOLD;
  const catState = getCatState(completedCount);

  const formatDate = (ds: string) => {
    const d = new Date(ds + "T00:00:00");
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const handleExport = useCallback(async () => {
    if (!exportRef.current || !dateStr) return;
    setIsExporting(true);
    try {
      // Pre-load all images in the export area to avoid blank images
      const images = exportRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                // Force reload with crossOrigin
                const src = img.src;
                img.crossOrigin = "anonymous";
                img.src = "";
                img.src = src;
              }
            })
        )
      );
      const blob = await domToBlob(exportRef.current, {
        scale: 2,
        backgroundColor: "#FFF5F0",
        features: { removeControlCharacter: false },
      });
      if (!blob) throw new Error("Failed to generate image");
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `checkin-${dateStr}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success("图片已保存！");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  }, [dateStr]);

  return (
    <Dialog open={!!dateStr} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md mx-auto rounded-2xl max-h-[85vh] overflow-y-auto">
        {/* Exportable card area */}
        <div
          ref={exportRef}
          className="bg-gradient-to-b from-[#FFF5F0] via-white to-[#F0E6FF] rounded-2xl p-5"
        >
          <DialogHeader>
            <DialogTitle className="text-center">
              {/* Cat image in dialog header */}
              <div className="flex justify-center mb-2">
                <img
                  src={CAT_IMAGES[catState]}
                  alt="cat"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="font-extrabold text-lg tracking-tight">
                {dateStr && formatDate(dateStr)}
              </div>
              <div className="text-sm font-normal text-muted-foreground mt-1">
                {isLotus ? (
                  <span>🪷 大圆满 · 完成 {completedCount}/{LOTUS_THRESHOLD}</span>
                ) : isStar ? (
                  <span>⭐ 猫猫认可 · 完成 {completedCount}/{LOTUS_THRESHOLD}</span>
                ) : (
                  <span>完成 {completedCount}/{LOTUS_THRESHOLD}</span>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-2">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
              ))
            ) : (
              TASK_TYPES.map((task) => {
                const record = checkins?.find((c) => c.taskId === task.id);
                const completed = record?.completed ?? false;
                const note = record?.note ?? "";

                return (
                  <TaskDetailItem
                    key={task.id}
                    task={task}
                    completed={completed}
                    note={note}
                    dateStr={dateStr ?? ""}
                    onUpdateNote={(newNote) => {
                      updateNoteMutation.mutate({
                        dateStr: dateStr ?? "",
                        taskId: task.id,
                        note: newNote,
                      });
                    }}
                    onDeleteNote={() => {
                      deleteNoteMutation.mutate({
                        dateStr: dateStr ?? "",
                        taskId: task.id,
                      });
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Daily log section in dialog */}
          {dailyLog?.content && (
            <div className="mt-4 p-3 rounded-xl bg-[#C3B1E1]/10 border border-[#C3B1E1]/20">
              <div className="text-xs font-bold text-[#C3B1E1] mb-1.5">📝 今日随笔</div>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {dailyLog.content}
              </p>
            </div>
          )}

          {/* Watermark */}
          <div className="mt-4 text-center text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
            Litch's Check
          </div>
        </div>

        {/* Export button — outside the exportable area */}
        <div className="flex justify-end pt-2 pb-1 px-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="gap-1.5 font-bold border-2 border-black/10 hover:border-primary/40"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? "生成中…" : "导出图片"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Task Detail Item with Edit/Delete ──────────────────────────

interface TaskDetailItemProps {
  task: (typeof TASK_TYPES)[number];
  completed: boolean;
  note: string;
  dateStr: string;
  onUpdateNote: (note: string) => void;
  onDeleteNote: () => void;
}

function TaskDetailItem({
  task,
  completed,
  note,
  dateStr,
  onUpdateNote,
  onDeleteNote,
}: TaskDetailItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(note);

  useEffect(() => {
    setEditValue(note);
  }, [note]);

  const handleSave = () => {
    onUpdateNote(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(note);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDeleteNote();
    setIsEditing(false);
  };

  return (
    <div
      className={`p-3 rounded-xl border-2 transition-all ${
        completed
          ? `${task.borderColor} bg-white/50`
          : "border-transparent bg-muted/30 opacity-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <TaskIcon task={task} size="sm" />
        <span
          className={`font-bold text-sm whitespace-nowrap ${
            completed ? "" : "line-through"
          }`}
        >
          {task.name}
        </span>
        {completed && (
          <span className="ml-auto text-xs font-bold text-green-600">✓</span>
        )}
      </div>

      {/* Note display with edit/delete */}
      {isEditing ? (
        <div className="mt-2 pl-7">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={2}
            autoFocus
            className="w-full text-sm bg-secondary/50 rounded-lg p-2 resize-none border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex items-center gap-1 mt-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              保存
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              取消
            </Button>
            {note && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                删除
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {note && (
            <div className="mt-1.5 pl-7 flex items-start gap-1">
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                {note}
              </p>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded hover:bg-secondary/60 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  title="编辑"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 rounded hover:bg-red-50 text-muted-foreground/50 hover:text-red-500 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          {completed && !note && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-1 pl-7 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              + 添加记录
            </button>
          )}
        </>
      )}
    </div>
  );
}
