import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { TASK_TYPES, STAR_THRESHOLD, LOTUS_THRESHOLD, type TaskType } from "../../../shared/tasks";
import { CAT_IMAGES, getCatState, getCatDialogue, getStreakMessage } from "../../../shared/catImages";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Task Icon Component (supports future hand-drawn icon replacement) ──
function TaskIcon({ task }: { task: TaskType }) {
  if (task.iconUrl) {
    return (
      <img
        src={task.iconUrl}
        alt={task.name}
        className="w-6 h-6 object-contain"
      />
    );
  }
  return <span className="text-lg">{task.emoji}</span>;
}

export default function DailyCheckin() {
  const [dateStr, setDateStr] = useState(getTodayStr);
  const todayStr = useMemo(getTodayStr, []);
  const isToday = dateStr === todayStr;
  const isFuture = dateStr > todayStr;

  const { data: checkins, isLoading } = trpc.checkin.getByDate.useQuery(
    { dateStr },
    { refetchOnWindowFocus: false }
  );

  // Fetch streak for dialogue system
  const { data: streakData } = trpc.checkin.streak.useQuery(
    { todayStr },
    { refetchOnWindowFocus: false }
  );
  const streak = streakData?.streak ?? 0;

  const utils = trpc.useUtils();

  const toggleMutation = trpc.checkin.toggle.useMutation({
    onSuccess: () => {
      utils.checkin.getByDate.invalidate({ dateStr });
      utils.checkin.streak.invalidate({ todayStr });
    },
  });

  const noteMutation = trpc.checkin.updateNote.useMutation({
    onSuccess: () => {
      utils.checkin.getByDate.invalidate({ dateStr });
    },
  });

  // Build task state from server data
  const taskStates = useMemo(() => {
    const map = new Map<number, { completed: boolean; note: string }>();
    if (checkins) {
      for (const c of checkins) {
        map.set(c.taskId, { completed: c.completed, note: c.note ?? "" });
      }
    }
    return TASK_TYPES.map((t) => ({
      ...t,
      completed: map.get(t.id)?.completed ?? false,
      note: map.get(t.id)?.note ?? "",
    }));
  }, [checkins]);

  const completedCount = taskStates.filter((t) => t.completed).length;
  const catState = getCatState(completedCount);
  const catImage = CAT_IMAGES[catState];
  const hasStar = completedCount >= STAR_THRESHOLD;
  const hasLotus = completedCount >= LOTUS_THRESHOLD;

  // Cat dialogue - stable within same state on same day
  const catDialogue = useMemo(
    () => getCatDialogue(completedCount, dateStr),
    [completedCount, dateStr]
  );
  const streakMessage = useMemo(
    () => getStreakMessage(streak),
    [streak]
  );

  const handleToggle = useCallback(
    (taskId: number, currentCompleted: boolean) => {
      toggleMutation.mutate({
        dateStr,
        taskId,
        completed: !currentCompleted,
      });
    },
    [dateStr, toggleMutation]
  );

  return (
    <div className="container max-w-lg mx-auto py-6 pb-24">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDateStr((d) => addDays(d, -1))}
          className="rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <h2 className="text-xl font-extrabold tracking-tight">
            {formatDateDisplay(dateStr)}
          </h2>
          {isToday && (
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              TODAY
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDateStr((d) => addDays(d, 1))}
          className="rounded-full"
          disabled={isFuture}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Cat Mascot with Speech Bubble */}
      <div className="flex flex-col items-center mb-5">
        {/* Cat + Speech Bubble layout */}
        <div className="flex items-start gap-1 max-w-sm w-full justify-center">
          {/* Speech Bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={catDialogue}
              initial={{ opacity: 0, scale: 0.85, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative mt-4 max-w-[180px]"
            >
              <div className="bg-white rounded-2xl rounded-br-sm px-3 py-2.5 shadow-md border-2 border-black/8">
                <p className="text-[13px] font-bold leading-snug text-foreground/90">
                  {catDialogue}
                </p>
                {streakMessage && hasStar && (
                  <p className="text-[11px] mt-1.5 pt-1.5 border-t border-black/5 text-primary font-bold">
                    {streakMessage}
                  </p>
                )}
              </div>
              {/* Bubble tail pointing right toward cat */}
              <div className="absolute -right-1.5 bottom-3 w-3 h-3 bg-white border-r-2 border-b-2 border-black/8 rotate-[-45deg]" />
            </motion.div>
          </AnimatePresence>

          {/* Cat Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={catState}
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex-shrink-0"
            >
              <img
                src={catImage}
                alt={`Cat ${catState}`}
                className="w-28 h-28 object-contain drop-shadow-lg"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Achievement badge - only shows when ≥3 */}
        <AnimatePresence mode="wait">
          {(hasStar || hasLotus) && (
            <motion.div
              key={catState + "-badge"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.15 }}
              className={`mt-2 text-center px-4 py-1.5 rounded-full text-xs font-extrabold ${
                hasLotus
                  ? "bg-gradient-to-r from-[#C3B1E1]/50 via-[#FFB7B2]/50 to-[#FFEAA7]/50 text-foreground"
                  : "bg-[#FFEAA7]/50 text-foreground"
              } border border-black/5`}
            >
              {hasLotus ? "🪷 大圆满" : "⭐ 猫猫认可"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task cards */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : (
          taskStates.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              dateStr={dateStr}
              onToggle={handleToggle}
              onNoteUpdate={(taskId, note) => {
                noteMutation.mutate({ dateStr, taskId, note });
              }}
            />
          ))
        )}
      </div>

      {/* Daily Log / Diary Section */}
      <DailyLogSection dateStr={dateStr} />
    </div>
  );
}

// ─── Task Card Component ────────────────────────────────────────

interface TaskCardProps {
  task: TaskType & { completed: boolean; note: string };
  dateStr: string;
  onToggle: (taskId: number, currentCompleted: boolean) => void;
  onNoteUpdate: (taskId: number, note: string) => void;
}

function TaskCard({ task, dateStr, onToggle, onNoteUpdate }: TaskCardProps) {
  const [localNote, setLocalNote] = useState(task.note);
  const [isEditing, setIsEditing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalNote(task.note);
  }, [task.note]);

  const handleNoteChange = useCallback(
    (value: string) => {
      setLocalNote(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onNoteUpdate(task.id, value);
      }, 800);
    },
    [task.id, onNoteUpdate]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`relative overflow-hidden transition-all duration-300 border-2 ${
          task.completed
            ? `${task.borderColor} shadow-md`
            : "border-border hover:border-black/15 shadow-sm"
        }`}
      >
        {/* Color accent bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${task.bgColor}`}
        />

        <CardContent className="p-4 pl-5">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <div className="pt-0.5">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggle(task.id, task.completed)}
                className={`w-6 h-6 rounded-md border-2 transition-all ${
                  task.completed ? "check-bounce" : ""
                }`}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TaskIcon task={task} />
                <span
                  className={`font-extrabold text-base tracking-tight ${
                    task.completed ? "line-through opacity-60" : ""
                  }`}
                >
                  {task.name}
                </span>
                {task.completed && (
                  <Sparkles className="w-4 h-4 text-[#F0D56E] reward-pop" />
                )}
              </div>

              {/* Note area */}
              {(task.completed || isEditing || localNote) && (
                <div className="mt-2">
                  <textarea
                    value={localNote}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => setIsEditing(false)}
                    placeholder="今天做了什么..."
                    rows={2}
                    className="w-full text-sm bg-secondary/50 rounded-lg p-2.5 resize-none border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-all"
                  />
                </div>
              )}

              {task.completed && !localNote && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  + 添加记录
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Daily Log Section ──────────────────────────────────────────

function DailyLogSection({ dateStr }: { dateStr: string }) {
  const { data: log, isLoading } = trpc.dailyLog.get.useQuery(
    { dateStr },
    { refetchOnWindowFocus: false }
  );

  const utils = trpc.useUtils();
  const saveMutation = trpc.dailyLog.save.useMutation({
    onSuccess: () => {
      utils.dailyLog.get.invalidate({ dateStr });
    },
  });

  const [localContent, setLocalContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalContent(log?.content ?? "");
    if (log?.content) {
      setIsExpanded(true);
    }
  }, [log]);

  const handleContentChange = useCallback(
    (value: string) => {
      setLocalContent(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveMutation.mutate({ dateStr, content: value });
      }, 800);
    },
    [dateStr, saveMutation]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="mt-6">
      <Card className="border-2 border-dashed border-black/10 bg-white/50 shadow-sm">
        <CardContent className="p-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 w-full text-left mb-2"
          >
            <BookOpen className="w-4 h-4 text-[#C3B1E1]" />
            <span className="font-extrabold text-sm tracking-tight">今日随笔</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {isExpanded ? "收起" : "展开"}
            </span>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {isLoading ? (
                  <div className="h-24 bg-muted rounded-lg animate-pulse" />
                ) : (
                  <textarea
                    value={localContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="今天有什么想记录的？自由书写..."
                    rows={4}
                    className="w-full text-sm bg-secondary/30 rounded-lg p-3 resize-none border-0 focus:outline-none focus:ring-2 focus:ring-[#C3B1E1]/30 placeholder:text-muted-foreground/40 transition-all leading-relaxed"
                  />
                )}
                {saveMutation.isPending && (
                  <div className="text-[10px] text-muted-foreground/50 mt-1 text-right">
                    保存中...
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
