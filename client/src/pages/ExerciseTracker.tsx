import { useState, useMemo, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { PRESET_EXERCISES, getExerciseById, type ExerciseType } from "../../../shared/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Trash2,
  Download,
  Dumbbell,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { toast } from "sonner";
import { domToBlob } from "modern-screenshot";

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

export default function ExerciseTracker() {
  const [dateStr, setDateStr] = useState(getTodayStr);
  const todayStr = useMemo(getTodayStr, []);
  const isToday = dateStr === todayStr;
  const isFuture = dateStr > todayStr;

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportExercise, setExportExercise] = useState<{
    exerciseId: string;
    sets?: number | null;
    duration?: string | null;
    note?: string | null;
    dateStr: string;
  } | null>(null);

  // Fetch training records for current date
  const { data: records, isLoading } = trpc.exercise.getByDate.useQuery(
    { dateStr },
    { refetchOnWindowFocus: false }
  );

  // Fetch starred exercises
  const { data: starredList } = trpc.exercise.starred.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const starredIds = useMemo(() => {
    return new Set(starredList?.map((s) => s.exerciseId) ?? []);
  }, [starredList]);

  const utils = trpc.useUtils();

  const addMutation = trpc.exercise.add.useMutation({
    onSuccess: () => {
      utils.exercise.getByDate.invalidate({ dateStr });
      utils.exercise.dates.invalidate();
      utils.exercise.stats.invalidate();
      toast.success("训练记录已添加 💪");
    },
  });

  const deleteMutation = trpc.exercise.delete.useMutation({
    onSuccess: () => {
      utils.exercise.getByDate.invalidate({ dateStr });
      utils.exercise.dates.invalidate();
      utils.exercise.stats.invalidate();
      toast.success("记录已删除");
    },
  });

  const toggleStarMutation = trpc.exercise.toggleStar.useMutation({
    onSuccess: (data) => {
      utils.exercise.starred.invalidate();
      toast.success(data.starred ? "已收藏 ⭐" : "已取消收藏");
    },
  });

  const handleAddExercise = useCallback(
    (exerciseId: string, sets?: number, duration?: string, note?: string) => {
      addMutation.mutate({
        dateStr,
        exerciseId,
        sets,
        duration,
        note,
      });
      setShowAddDialog(false);
    },
    [dateStr, addMutation]
  );

  const handleExport = useCallback(
    (record: typeof exportExercise) => {
      setExportExercise(record);
      setShowExportDialog(true);
    },
    []
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

      {/* Header with mascot */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFB7B2]/30 border border-[#FFB7B2]/50">
          <Dumbbell className="w-5 h-5 text-[#8B3A36]" />
          <span className="font-extrabold text-sm text-[#8B3A36]">
            今日训练 {records?.length ?? 0} 项
          </span>
        </div>
        <Link
          href="/exercise/collection"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#FFEAA7]/30 border border-[#FFEAA7]/50 hover:bg-[#FFEAA7]/50 transition-colors"
        >
          <Trophy className="w-4 h-4 text-[#6B5B00]" />
          <span className="font-extrabold text-xs text-[#6B5B00]">图鉴</span>
        </Link>
      </div>

      {/* Training records list */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : records && records.length > 0 ? (
          records.map((record) => {
            const exercise = getExerciseById(record.exerciseId);
            if (!exercise) return null;
            const isStarred = starredIds.has(record.exerciseId);

            return (
              <motion.div
                key={record.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="relative overflow-hidden border-2 border-[#F09590] shadow-md">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FFB7B2]" />
                  <CardContent className="p-4 pl-5">
                    <div className="flex items-start gap-3">
                      {/* Exercise image */}
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[#FFB7B2]/20 border border-[#F09590]/30">
                        <img
                          src={exercise.imageUrl}
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-extrabold text-base tracking-tight">
                            {exercise.name}
                          </span>
                          <button
                            onClick={() => toggleStarMutation.mutate({ exerciseId: exercise.id })}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isStarred
                                  ? "fill-[#FFEAA7] text-[#F0D56E]"
                                  : "text-muted-foreground/40"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {record.sets && (
                            <span className="bg-[#FFB7B2]/20 px-2 py-0.5 rounded-full font-bold">
                              {record.sets} 组
                            </span>
                          )}
                          {record.duration && (
                            <span className="bg-[#FFEAA7]/30 px-2 py-0.5 rounded-full font-bold">
                              {record.duration}
                            </span>
                          )}
                        </div>

                        {record.note && (
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                            {record.note}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() =>
                            handleExport({
                              exerciseId: record.exerciseId,
                              sets: record.sets,
                              duration: record.duration,
                              note: record.note,
                              dateStr,
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
                          title="导出卡片"
                        >
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("确定删除这条记录？")) {
                              deleteMutation.mutate({ id: record.id });
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground/60 font-bold">
              今天还没有训练记录
            </p>
            <p className="text-xs text-muted-foreground/40 mt-1">
              点击下方按钮添加训练
            </p>
          </div>
        )}
      </div>

      {/* Add button */}
      <motion.div
        className="fixed bottom-20 right-4 z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setShowAddDialog(true)}
          className="rounded-full w-14 h-14 shadow-lg bg-[#FFB7B2] hover:bg-[#F09590] text-white border-2 border-[#F09590]"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Add Exercise Dialog */}
      <AddExerciseDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddExercise}
        starredIds={starredIds}
      />

      {/* Export Card Dialog */}
      {exportExercise && (
        <ExportCardDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          exercise={exportExercise}
        />
      )}
    </div>
  );
}

// ─── Add Exercise Dialog ──────────────────────────────────────

function AddExerciseDialog({
  open,
  onOpenChange,
  onAdd,
  starredIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (exerciseId: string, sets?: number, duration?: string, note?: string) => void;
  starredIds: Set<string>;
}) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);
  const [sets, setSets] = useState("");
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");
  const [showAll, setShowAll] = useState(false);

  const starredExercises = PRESET_EXERCISES.filter((e) => starredIds.has(e.id));
  const otherExercises = PRESET_EXERCISES.filter((e) => !starredIds.has(e.id));

  const handleSubmit = () => {
    if (!selectedExercise) return;
    onAdd(
      selectedExercise.id,
      sets ? parseInt(sets) : undefined,
      duration || undefined,
      note || undefined
    );
    // Reset form
    setSelectedExercise(null);
    setSets("");
    setDuration("");
    setNote("");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedExercise(null);
      setSets("");
      setDuration("");
      setNote("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg">添加训练</DialogTitle>
        </DialogHeader>

        {!selectedExercise ? (
          <div className="space-y-4">
            {/* Starred exercises first */}
            {starredExercises.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#FFEAA7] text-[#F0D56E]" />
                  常用动作
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {starredExercises.map((exercise) => (
                    <ExercisePickerItem
                      key={exercise.id}
                      exercise={exercise}
                      isStarred
                      onClick={() => setSelectedExercise(exercise)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All exercises */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {starredExercises.length > 0 ? "其他动作" : "选择动作"}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(showAll ? otherExercises : otherExercises.slice(0, 6)).map(
                  (exercise) => (
                    <ExercisePickerItem
                      key={exercise.id}
                      exercise={exercise}
                      isStarred={false}
                      onClick={() => setSelectedExercise(exercise)}
                    />
                  )
                )}
              </div>
              {!showAll && otherExercises.length > 6 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full mt-2 text-xs text-primary font-bold hover:underline"
                >
                  查看全部 ({otherExercises.length})
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected exercise preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFB7B2]/10 border border-[#FFB7B2]/30">
              <img
                src={selectedExercise.imageUrl}
                alt={selectedExercise.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <div className="font-extrabold">{selectedExercise.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedExercise.description}
                </div>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="ml-auto text-xs text-primary font-bold"
              >
                换一个
              </button>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                  组数
                </label>
                <input
                  type="number"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  placeholder="例如 3"
                  className="w-full text-sm bg-secondary/50 rounded-lg p-2.5 border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                  时长
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="例如 30分钟"
                  className="w-full text-sm bg-secondary/50 rounded-lg p-2.5 border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">
                备注
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="今天的训练感受..."
                rows={2}
                className="w-full text-sm bg-secondary/50 rounded-lg p-2.5 resize-none border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full font-extrabold bg-[#FFB7B2] hover:bg-[#F09590] text-white"
            >
              添加记录
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExercisePickerItem({
  exercise,
  isStarred,
  onClick,
}: {
  exercise: ExerciseType;
  isStarred: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 border-transparent hover:border-[#FFB7B2]/50 hover:bg-[#FFB7B2]/10 transition-all active:scale-95"
    >
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#FFB7B2]/10">
        <img
          src={exercise.imageUrl}
          alt={exercise.name}
          className="w-full h-full object-cover"
        />
        {isStarred && (
          <div className="absolute top-0 right-0 p-0.5">
            <Star className="w-3 h-3 fill-[#FFEAA7] text-[#F0D56E]" />
          </div>
        )}
      </div>
      <span className="text-[11px] font-bold text-center leading-tight">
        {exercise.name}
      </span>
    </button>
  );
}

// ─── Export Card Dialog ───────────────────────────────────────

function ExportCardDialog({
  open,
  onOpenChange,
  exercise: recordData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: {
    exerciseId: string;
    sets?: number | null;
    duration?: string | null;
    note?: string | null;
    dateStr: string;
  };
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const exerciseType = getExerciseById(recordData.exerciseId);

  if (!exerciseType) return null;

  const formatDate = (ds: string) => {
    const d = new Date(ds + "T00:00:00");
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      const blob = await domToBlob(cardRef.current, {
        scale: 2,
        width: 360,
        height: 480,
      });

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `训练卡片_${exerciseType.name}_${recordData.dateStr}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("卡片已导出 📸");
      }
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg">导出训练卡片</DialogTitle>
        </DialogHeader>

        {/* Card preview */}
        <div className="flex justify-center">
          <div
            ref={cardRef}
            className="w-[360px] h-[480px] rounded-2xl overflow-hidden shadow-lg"
            style={{
              background: "linear-gradient(180deg, #FFF5F0 0%, #FFFFFF 50%, #F0E6FF 100%)",
            }}
          >
            {/* Top: Exercise image (1:1 area) */}
            <div className="w-full aspect-square relative overflow-hidden">
              <img
                src={exerciseType.imageUrl}
                alt={exerciseType.name}
                className="w-full h-full object-cover"
              />
              {/* Memphis decorations */}
              <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-[#A8E6CF]/40" />
              <div className="absolute top-3 right-3 w-4 h-4 bg-[#C3B1E1]/40 rotate-45" />
              <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full border-2 border-[#FFEAA7]/60" />
            </div>

            {/* Bottom: Info */}
            <div className="px-5 py-4 flex flex-col justify-between" style={{ height: "calc(100% - 100%/4*3)" }}>
              <div>
                <h3 className="font-extrabold text-xl tracking-tight text-foreground mb-1">
                  {exerciseType.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  {exerciseType.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {recordData.sets && (
                    <span className="text-xs bg-[#FFB7B2]/30 px-2 py-0.5 rounded-full font-bold text-[#8B3A36]">
                      {recordData.sets} 组
                    </span>
                  )}
                  {recordData.duration && (
                    <span className="text-xs bg-[#FFEAA7]/40 px-2 py-0.5 rounded-full font-bold text-[#6B5B00]">
                      {recordData.duration}
                    </span>
                  )}
                </div>
                {recordData.note && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    "{recordData.note}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  Litch's Check
                </span>
                <span className="text-[10px] font-bold text-muted-foreground/60">
                  {formatDate(recordData.dateStr)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full font-extrabold bg-[#FFB7B2] hover:bg-[#F09590] text-white"
        >
          {isExporting ? "导出中..." : "保存卡片"}
          <Download className="w-4 h-4 ml-2" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
