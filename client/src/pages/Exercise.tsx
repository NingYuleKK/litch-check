import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Trash2,
  Clock,
  Dumbbell,
  X,
  Check,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { domToBlob } from "modern-screenshot";
import { imageToBase64 } from "@/lib/imageToBase64";
import {
  getTrainingRecordByDate,
  saveTrainingRecord,
  deleteTrainingRecord,
  getStarredActions,
  addStarredAction,
  removeStarredAction,
} from "@/lib/exerciseStorage";
import {
  type ExerciseAction,
  type ExerciseSet,
  type TrainingRecord,
  type StarredAction,
  EXERCISE_PLACEHOLDER_IMAGE,
  COMMON_EXERCISES,
} from "../../../shared/exercise";
import { CAT_IMAGES } from "../../../shared/catImages";

// ─── Helpers ──────────────────────────────────────────────────

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

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// ─── Main Page ────────────────────────────────────────────────

export default function Exercise() {
  const [dateStr, setDateStr] = useState(getTodayStr);
  const todayStr = useMemo(getTodayStr, []);
  const isToday = dateStr === todayStr;
  const isFuture = dateStr > todayStr;

  // Training record for current date
  const [record, setRecord] = useState<TrainingRecord | null>(null);
  const [showAddAction, setShowAddAction] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showExportCard, setShowExportCard] = useState<ExerciseAction | null>(null);

  // Load record when date changes
  useEffect(() => {
    const r = getTrainingRecordByDate(dateStr);
    setRecord(r);
  }, [dateStr]);

  // Persist record
  const persistRecord = useCallback(
    (updated: TrainingRecord) => {
      setRecord(updated);
      saveTrainingRecord(updated);
    },
    []
  );

  // Create or get record
  const ensureRecord = useCallback((): TrainingRecord => {
    if (record) return record;
    const newRecord: TrainingRecord = {
      id: generateId(),
      dateStr,
      actions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newRecord;
  }, [record, dateStr]);

  // Add action to record
  const handleAddAction = useCallback(
    (action: ExerciseAction) => {
      const r = ensureRecord();
      const updated = {
        ...r,
        actions: [...r.actions, action],
        updatedAt: new Date().toISOString(),
      };
      persistRecord(updated);
      setShowAddAction(false);
      toast.success(`已添加「${action.name}」`);
    },
    [ensureRecord, persistRecord]
  );

  // Remove action from record
  const handleRemoveAction = useCallback(
    (actionId: string) => {
      if (!record) return;
      const updated = {
        ...record,
        actions: record.actions.filter((a) => a.id !== actionId),
        updatedAt: new Date().toISOString(),
      };
      persistRecord(updated);
      toast.success("已移除");
    },
    [record, persistRecord]
  );

  // Update action in record
  const handleUpdateAction = useCallback(
    (actionId: string, updates: Partial<ExerciseAction>) => {
      if (!record) return;
      const updated = {
        ...record,
        actions: record.actions.map((a) =>
          a.id === actionId ? { ...a, ...updates } : a
        ),
        updatedAt: new Date().toISOString(),
      };
      persistRecord(updated);
    },
    [record, persistRecord]
  );

  // Star/unstar an action
  const handleToggleStar = useCallback(
    (action: ExerciseAction) => {
      const starred = getStarredActions();
      const existing = starred.find((s) => s.name === action.name);
      if (existing) {
        removeStarredAction(existing.id);
        toast.success(`已取消收藏「${action.name}」`);
      } else {
        const starredAction: StarredAction = {
          id: generateId(),
          name: action.name,
          description: action.description,
          imageUrl: action.imageUrl,
          type: action.type,
          defaultSets: action.type === "sets" ? action.sets : undefined,
          defaultDuration: action.type === "duration" ? action.duration : undefined,
          starredAt: new Date().toISOString(),
        };
        addStarredAction(starredAction);
        toast.success(`已收藏「${action.name}」到常用动作库`);
      }
      // Force re-render
      setRecord((r) => (r ? { ...r } : r));
    },
    []
  );

  const actions = record?.actions ?? [];
  const hasActions = actions.length > 0;

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

      {/* Header area with cat */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <img
          src={CAT_IMAGES.encourage}
          alt="司马黑"
          className="w-16 h-16 object-contain drop-shadow-md"
        />
        <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-md border-2 border-black/8 max-w-[200px] relative">
          <p className="text-[13px] font-bold leading-snug text-foreground/90">
            {hasActions
              ? `今天练了${actions.length}个动作，不错嘛！`
              : "今天打算练什么？司马黑等着呢。"}
          </p>
          <div className="absolute -left-1.5 bottom-3 w-3 h-3 bg-white border-l-2 border-b-2 border-black/8 rotate-[45deg]" />
        </div>
      </div>

      {/* Action buttons row */}
      <div className="flex gap-2 mb-4">
        <Button
          onClick={() => setShowAddAction(true)}
          className="flex-1 gap-1.5 font-bold rounded-xl border-2 border-[#FFB7B2]/40 bg-[#FFB7B2]/20 text-[#8B3A36] hover:bg-[#FFB7B2]/30 shadow-none"
          variant="ghost"
        >
          <Plus className="w-4 h-4" />
          添加动作
        </Button>
        <Button
          onClick={() => setShowFavorites(true)}
          variant="ghost"
          className="gap-1.5 font-bold rounded-xl border-2 border-[#FFEAA7]/40 bg-[#FFEAA7]/20 text-[#6B5B00] hover:bg-[#FFEAA7]/30 shadow-none"
        >
          <Star className="w-4 h-4" />
          常用动作
        </Button>
      </div>

      {/* Training actions list */}
      {hasActions ? (
        <div className="space-y-3">
          <AnimatePresence>
            {actions.map((action, idx) => (
              <ExerciseActionCard
                key={action.id}
                action={action}
                index={idx}
                onRemove={() => handleRemoveAction(action.id)}
                onUpdate={(updates) => handleUpdateAction(action.id, updates)}
                onToggleStar={() => handleToggleStar(action)}
                onExport={() => setShowExportCard(action)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty state with 司马黑 */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <img
            src={CAT_IMAGES.lazy}
            alt="司马黑"
            className="w-32 h-32 mx-auto mb-4 object-contain opacity-60"
          />
          <p className="text-sm font-bold text-muted-foreground/60">
            今天还没有训练记录
          </p>
          <p className="text-xs text-muted-foreground/40 mt-1">
            点击「添加动作」开始记录吧
          </p>
        </motion.div>
      )}

      {/* Session note */}
      {hasActions && (
        <SessionNote
          note={record?.note ?? ""}
          onSave={(note) => {
            const r = ensureRecord();
            persistRecord({ ...r, note, updatedAt: new Date().toISOString() });
          }}
        />
      )}

      {/* Add Action Dialog */}
      <AddActionDialog
        open={showAddAction}
        onClose={() => setShowAddAction(false)}
        onAdd={handleAddAction}
        existingNames={actions.map((a) => a.name)}
      />

      {/* Favorites Library Dialog */}
      <FavoritesDialog
        open={showFavorites}
        onClose={() => setShowFavorites(false)}
        onSelect={(starred) => {
          const action: ExerciseAction = {
            id: generateId(),
            name: starred.name,
            description: starred.description,
            imageUrl: starred.imageUrl,
            type: starred.type,
            sets: starred.defaultSets ?? [{ setNumber: 1, value: "" }],
            duration: starred.defaultDuration,
          };
          handleAddAction(action);
          setShowFavorites(false);
        }}
      />

      {/* Export Card Dialog */}
      {showExportCard && (
        <ExportCardDialog
          action={showExportCard}
          dateStr={dateStr}
          onClose={() => setShowExportCard(null)}
        />
      )}
    </div>
  );
}

// ─── Exercise Action Card ─────────────────────────────────────

interface ExerciseActionCardProps {
  action: ExerciseAction;
  index: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<ExerciseAction>) => void;
  onToggleStar: () => void;
  onExport: () => void;
}

function ExerciseActionCard({
  action,
  index,
  onRemove,
  onUpdate,
  onToggleStar,
  onExport,
}: ExerciseActionCardProps) {
  const starred = getStarredActions();
  const isStarred = starred.some((s) => s.name === action.name);

  const handleAddSet = () => {
    const newSet: ExerciseSet = {
      setNumber: action.sets.length + 1,
      value: "",
    };
    onUpdate({ sets: [...action.sets, newSet] });
  };

  const handleUpdateSet = (setIdx: number, updates: Partial<ExerciseSet>) => {
    const newSets = action.sets.map((s, i) =>
      i === setIdx ? { ...s, ...updates } : s
    );
    onUpdate({ sets: newSets });
  };

  const handleRemoveSet = (setIdx: number) => {
    const newSets = action.sets
      .filter((_, i) => i !== setIdx)
      .map((s, i) => ({ ...s, setNumber: i + 1 }));
    onUpdate({ sets: newSets });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Card className="relative overflow-hidden border-2 border-[#FFB7B2]/30 shadow-sm hover:shadow-md transition-all">
        {/* Coral accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FFB7B2]" />

        <CardContent className="p-4 pl-5">
          {/* Header row */}
          <div className="flex items-start gap-3">
            {/* Action image */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#FFB7B2]/10 border-2 border-[#FFB7B2]/20 flex-shrink-0 flex items-center justify-center">
              {action.imageUrl ? (
                <img
                  src={action.imageUrl}
                  alt={action.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Dumbbell className="w-5 h-5 text-[#F09590]" />
              )}
            </div>

            {/* Name & description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight">
                  {action.name}
                </span>
                <button
                  onClick={onToggleStar}
                  className="p-0.5 transition-colors"
                  title={isStarred ? "取消收藏" : "收藏到常用"}
                >
                  <Star
                    className={`w-4 h-4 transition-all ${
                      isStarred
                        ? "text-[#F0D56E] fill-[#F0D56E] scale-110"
                        : "text-muted-foreground/30 hover:text-[#F0D56E]"
                    }`}
                  />
                </button>
              </div>
              {action.description && (
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {action.description}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={onExport}
                className="p-1.5 rounded-lg hover:bg-[#FFB7B2]/10 text-muted-foreground/40 hover:text-[#8B3A36] transition-colors"
                title="导出卡片"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground/40 hover:text-red-500 transition-colors"
                title="移除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sets or Duration */}
          <div className="mt-3 pl-0">
            {action.type === "sets" ? (
              <div className="space-y-1.5">
                {action.sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-1.5"
                  >
                    <span className="text-[11px] font-bold text-muted-foreground/60 w-8">
                      第{set.setNumber}组
                    </span>
                    <input
                      type="text"
                      value={set.value}
                      onChange={(e) =>
                        handleUpdateSet(setIdx, { value: e.target.value })
                      }
                      placeholder="次数"
                      className="flex-1 text-sm bg-transparent border-0 focus:outline-none font-bold placeholder:text-muted-foreground/30"
                    />
                    <input
                      type="text"
                      value={set.weight ?? ""}
                      onChange={(e) =>
                        handleUpdateSet(setIdx, { weight: e.target.value || undefined })
                      }
                      placeholder="重量"
                      className="w-16 text-sm bg-transparent border-0 focus:outline-none text-right font-bold placeholder:text-muted-foreground/30"
                    />
                    {action.sets.length > 1 && (
                      <button
                        onClick={() => handleRemoveSet(setIdx)}
                        className="p-0.5 text-muted-foreground/30 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddSet}
                  className="text-xs font-bold text-[#F09590] hover:text-[#8B3A36] transition-colors flex items-center gap-1 pl-3"
                >
                  <Plus className="w-3 h-3" />
                  添加组
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2">
                <Clock className="w-4 h-4 text-muted-foreground/40" />
                <input
                  type="number"
                  value={action.duration ?? ""}
                  onChange={(e) =>
                    onUpdate({ duration: Number(e.target.value) || undefined })
                  }
                  placeholder="时长"
                  className="w-16 text-sm bg-transparent border-0 focus:outline-none font-bold placeholder:text-muted-foreground/30"
                />
                <span className="text-xs text-muted-foreground/50">分钟</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Session Note ─────────────────────────────────────────────

function SessionNote({
  note,
  onSave,
}: {
  note: string;
  onSave: (note: string) => void;
}) {
  const [localNote, setLocalNote] = useState(note);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalNote(note);
  }, [note]);

  const handleChange = (value: string) => {
    setLocalNote(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSave(value);
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="mt-5">
      <Card className="border-2 border-dashed border-[#FFB7B2]/20 bg-white/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-4 h-4 text-[#F09590]" />
            <span className="font-extrabold text-sm tracking-tight">训练感想</span>
          </div>
          <textarea
            value={localNote}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="今天训练感觉怎么样？"
            rows={3}
            className="w-full text-sm bg-secondary/30 rounded-lg p-3 resize-none border-0 focus:outline-none focus:ring-2 focus:ring-[#FFB7B2]/30 placeholder:text-muted-foreground/40 transition-all leading-relaxed"
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Add Action Dialog ────────────────────────────────────────

interface AddActionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (action: ExerciseAction) => void;
  existingNames: string[];
}

function AddActionDialog({ open, onClose, onAdd, existingNames }: AddActionDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"sets" | "duration">("sets");
  const [imageUrl, setImageUrl] = useState("");
  const [tab, setTab] = useState<"custom" | "preset">("preset");

  // Reset on open
  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setType("sets");
      setImageUrl("");
      setTab("preset");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("请输入动作名称");
      return;
    }
    const action: ExerciseAction = {
      id: generateId(),
      name: name.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      type,
      sets: type === "sets" ? [{ setNumber: 1, value: "" }] : [],
      duration: type === "duration" ? undefined : undefined,
    };
    onAdd(action);
  };

  const handlePresetSelect = (preset: (typeof COMMON_EXERCISES)[number]) => {
    if (existingNames.includes(preset.name)) {
      toast.error(`「${preset.name}」已在今天的训练中`);
      return;
    }
    const action: ExerciseAction = {
      id: generateId(),
      name: preset.name,
      description: preset.description,
      type: preset.type,
      sets: preset.type === "sets" ? [{ setNumber: 1, value: "" }] : [],
    };
    onAdd(action);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md mx-auto rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg tracking-tight text-center">
            添加训练动作
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-4">
          <button
            onClick={() => setTab("preset")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === "preset"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            常见动作
          </button>
          <button
            onClick={() => setTab("custom")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === "custom"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            自定义
          </button>
        </div>

        {tab === "preset" ? (
          <div className="grid grid-cols-2 gap-2">
            {COMMON_EXERCISES.map((preset) => {
              const isAdded = existingNames.includes(preset.name);
              return (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  disabled={isAdded}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    isAdded
                      ? "border-green-200 bg-green-50/50 opacity-60"
                      : "border-black/5 hover:border-[#FFB7B2]/40 hover:bg-[#FFB7B2]/5 active:scale-95"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {preset.type === "sets" ? (
                      <Dumbbell className="w-3.5 h-3.5 text-[#F09590]" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-[#87CEEB]" />
                    )}
                    <span className="font-bold text-sm">{preset.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60">
                    {isAdded ? "✓ 已添加" : preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">
                动作名称 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：杠铃深蹲"
                className="w-full text-sm bg-secondary/30 rounded-lg p-2.5 border-2 border-transparent focus:border-[#FFB7B2]/40 focus:outline-none font-bold placeholder:text-muted-foreground/30 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">
                简短说明
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：腿部力量训练"
                className="w-full text-sm bg-secondary/30 rounded-lg p-2.5 border-2 border-transparent focus:border-[#FFB7B2]/40 focus:outline-none placeholder:text-muted-foreground/30 transition-all"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">
                记录方式
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setType("sets")}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    type === "sets"
                      ? "border-[#FFB7B2]/40 bg-[#FFB7B2]/10 text-[#8B3A36]"
                      : "border-black/5 text-muted-foreground"
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  组数/次数
                </button>
                <button
                  onClick={() => setType("duration")}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    type === "duration"
                      ? "border-[#87CEEB]/40 bg-[#87CEEB]/10 text-[#1A4A6B]"
                      : "border-black/5 text-muted-foreground"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  时长
                </button>
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">
                图片 URL（可选）
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-sm bg-secondary/30 rounded-lg p-2.5 border-2 border-transparent focus:border-[#FFB7B2]/40 focus:outline-none placeholder:text-muted-foreground/30 transition-all"
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full font-bold rounded-xl bg-[#FFB7B2] hover:bg-[#F09590] text-white border-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加到今天的训练
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Favorites Library Dialog ─────────────────────────────────

interface FavoritesDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (starred: StarredAction) => void;
}

function FavoritesDialog({ open, onClose, onSelect }: FavoritesDialogProps) {
  const [starred, setStarred] = useState<StarredAction[]>([]);

  useEffect(() => {
    if (open) {
      setStarred(getStarredActions());
    }
  }, [open]);

  const handleRemove = (id: string) => {
    removeStarredAction(id);
    setStarred((prev) => prev.filter((a) => a.id !== id));
    toast.success("已从常用动作库移除");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md mx-auto rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg tracking-tight text-center flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-[#F0D56E] fill-[#F0D56E]" />
            常用动作库
          </DialogTitle>
        </DialogHeader>

        {starred.length === 0 ? (
          <div className="text-center py-10">
            <img
              src={CAT_IMAGES.normal}
              alt="司马黑"
              className="w-24 h-24 mx-auto mb-3 object-contain opacity-50"
            />
            <p className="text-sm font-bold text-muted-foreground/50">
              还没有收藏的动作
            </p>
            <p className="text-xs text-muted-foreground/30 mt-1">
              在训练记录中点击 ⭐ 收藏常用动作
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {starred.map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-[#FFEAA7]/30 bg-[#FFEAA7]/5 hover:bg-[#FFEAA7]/10 transition-all"
              >
                {/* Image */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#FFEAA7]/20 border border-[#FFEAA7]/30 flex-shrink-0 flex items-center justify-center">
                  {action.imageUrl ? (
                    <img
                      src={action.imageUrl}
                      alt={action.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Star className="w-4 h-4 text-[#F0D56E]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">{action.name}</span>
                    {action.type === "sets" ? (
                      <Dumbbell className="w-3 h-3 text-[#F09590]" />
                    ) : (
                      <Clock className="w-3 h-3 text-[#87CEEB]" />
                    )}
                  </div>
                  {action.description && (
                    <p className="text-[11px] text-muted-foreground/50 truncate">
                      {action.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelect(action)}
                    className="h-8 px-3 text-xs font-bold text-[#8B3A36] hover:bg-[#FFB7B2]/10"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    使用
                  </Button>
                  <button
                    onClick={() => handleRemove(action.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground/30 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Export Card Dialog ───────────────────────────────────────

interface ExportCardDialogProps {
  action: ExerciseAction;
  dateStr: string;
  onClose: () => void;
}

function ExportCardDialog({ action, dateStr, onClose }: ExportCardDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (ds: string) => {
    const d = new Date(ds + "T00:00:00");
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    const el = cardRef.current;
    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
    const originalSrcs = imgs.map((img) => img.src);

    try {
      await Promise.all(
        imgs.map(async (img) => {
          const src = img.getAttribute("src");
          if (!src || src.startsWith("data:")) return;
          const base64 = await imageToBase64(src);
          img.src = base64;
        })
      );

      const blob = await domToBlob(el, {
        scale: 2,
        backgroundColor: "#FFF5F0",
        features: { removeControlCharacter: false },
      });

      if (!blob) throw new Error("Failed to generate image");
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `exercise-${action.name}-${dateStr}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success("卡片已保存！");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("导出失败，请重试");
    } finally {
      imgs.forEach((img, i) => {
        img.src = originalSrcs[i]!;
      });
      setIsExporting(false);
    }
  };

  const imageUrl = action.imageUrl || EXERCISE_PLACEHOLDER_IMAGE;

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-base tracking-tight text-center">
            导出训练卡片
          </DialogTitle>
        </DialogHeader>

        {/* 3:4 Card Preview */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-2xl border-[3px] border-black/10 bg-gradient-to-b from-[#FFF5F0] via-white to-[#FFE8E5]"
          style={{ aspectRatio: "3/4" }}
        >
          {/* Memphis decorations */}
          <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full border-[3px] border-[#FFB7B2]/30 bg-[#FFB7B2]/10 pointer-events-none" />
          <div className="absolute -bottom-2 -left-2 w-12 h-12 border-[3px] border-[#FFEAA7]/30 bg-[#FFEAA7]/10 rotate-45 pointer-events-none" />
          <svg className="absolute top-3 left-3 w-6 h-6 pointer-events-none" viewBox="0 0 32 32">
            <polygon points="16,2 30,28 2,28" fill="none" stroke="rgba(195,177,225,0.3)" strokeWidth="2.5" />
            <polygon points="16,6 26,24 6,24" fill="rgba(195,177,225,0.1)" />
          </svg>

          {/* Top half: 1:1 image */}
          <div className="relative w-full" style={{ paddingBottom: "75%" }}>
            <div className="absolute inset-0 flex items-center justify-center bg-[#FFB7B2]/5">
              <img
                src={imageUrl}
                alt={action.name}
                className="w-full h-full object-contain p-4"
              />
            </div>
          </div>

          {/* Bottom half: info */}
          <div className="relative z-10 px-5 py-4 flex flex-col justify-between" style={{ minHeight: "25%" }}>
            <div>
              <h3 className="font-black text-xl tracking-tight mb-1">
                {action.name}
              </h3>
              {action.description && (
                <p className="text-sm text-muted-foreground/70 mb-2">
                  {action.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/60">
                {action.type === "sets" && action.sets.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-3 h-3" />
                    {action.sets.length}组
                    {action.sets.some((s) => s.value) &&
                      ` · ${action.sets.filter((s) => s.value).map((s) => `${s.value}${s.weight ? `×${s.weight}` : ""}`).join(", ")}`}
                  </span>
                )}
                {action.type === "duration" && action.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {action.duration}分钟
                  </span>
                )}
              </div>
            </div>

            {/* Date & watermark */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5">
              <span className="text-[11px] font-bold text-muted-foreground/40">
                {formatDate(dateStr)}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.15em]">
                Litch's Check
              </span>
            </div>
          </div>
        </div>

        {/* Export button */}
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="gap-1.5 font-bold rounded-xl bg-[#FFB7B2] hover:bg-[#F09590] text-white border-0 px-6"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "生成中…" : "保存到手机"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
