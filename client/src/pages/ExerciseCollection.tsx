import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PRESET_EXERCISES, getExerciseById } from "../../../shared/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Trophy, Calendar, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function ExerciseCollection() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<"count" | "time">("count");

  const { data: starredList } = trpc.exercise.starred.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const { data: stats } = trpc.exercise.stats.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const starredIds = useMemo(() => {
    return new Set(starredList?.map((s) => s.exerciseId) ?? []);
  }, [starredList]);

  const statsMap = useMemo(() => {
    const map: Record<string, { totalCount: number; lastDate: string }> = {};
    stats?.forEach((s) => {
      map[s.exerciseId] = { totalCount: s.totalCount, lastDate: s.lastDate };
    });
    return map;
  }, [stats]);

  const utils = trpc.useUtils();

  const toggleStarMutation = trpc.exercise.toggleStar.useMutation({
    onSuccess: (data) => {
      utils.exercise.starred.invalidate();
      toast.success(data.starred ? "已收藏 ⭐" : "已取消收藏");
    },
  });

  // Filter starred exercises and sort
  const starredExercises = useMemo(() => {
    const exercises = PRESET_EXERCISES.filter((e) => starredIds.has(e.id)).map(
      (e) => ({
        ...e,
        totalCount: statsMap[e.id]?.totalCount ?? 0,
        lastDate: statsMap[e.id]?.lastDate ?? "",
      })
    );

    if (sortBy === "count") {
      exercises.sort((a, b) => b.totalCount - a.totalCount);
    } else {
      exercises.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
    }

    return exercises;
  }, [starredIds, statsMap, sortBy]);

  // All exercises for the "全部动作" section
  const allExercises = useMemo(() => {
    return PRESET_EXERCISES.map((e) => ({
      ...e,
      totalCount: statsMap[e.id]?.totalCount ?? 0,
      lastDate: statsMap[e.id]?.lastDate ?? "",
      isStarred: starredIds.has(e.id),
    }));
  }, [statsMap, starredIds]);

  return (
    <div className="container max-w-lg mx-auto py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setLocation("/exercise")}
          className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FFEAA7]" />
            训练图鉴
          </h1>
          <p className="text-xs text-muted-foreground">
            收藏的训练动作和打卡记录
          </p>
        </div>
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setSortBy("count")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            sortBy === "count"
              ? "bg-[#FFB7B2] text-white"
              : "bg-secondary/50 text-muted-foreground"
          }`}
        >
          按打卡次数
        </button>
        <button
          onClick={() => setSortBy("time")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            sortBy === "time"
              ? "bg-[#FFB7B2] text-white"
              : "bg-secondary/50 text-muted-foreground"
          }`}
        >
          按时间轴
        </button>
      </div>

      {/* Starred exercises collection */}
      {starredExercises.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-[#FFEAA7] text-[#F0D56E]" />
            我的收藏 ({starredExercises.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {starredExercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-2 border-[#FFEAA7]/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-square overflow-hidden bg-[#FFB7B2]/10">
                    <img
                      src={exercise.imageUrl}
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Star badge */}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() =>
                          toggleStarMutation.mutate({ exerciseId: exercise.id })
                        }
                      >
                        <Star className="w-5 h-5 fill-[#FFEAA7] text-[#F0D56E] drop-shadow-sm" />
                      </button>
                    </div>
                    {/* Count badge */}
                    {exercise.totalCount > 0 && (
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-[#FFB7B2]" />
                        <span className="text-[10px] font-extrabold">
                          {exercise.totalCount}次
                        </span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-extrabold text-sm mb-0.5">
                      {exercise.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {exercise.description}
                    </p>
                    {exercise.lastDate && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground/50" />
                        <span className="text-[10px] text-muted-foreground/60">
                          最近: {exercise.lastDate}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 mb-6">
          <Star className="w-10 h-10 mx-auto text-muted-foreground/20 mb-2" />
          <p className="text-sm text-muted-foreground/50 font-bold">
            还没有收藏的动作
          </p>
          <p className="text-xs text-muted-foreground/40 mt-1">
            在训练记录中点击星标收藏
          </p>
        </div>
      )}

      {/* All exercises overview */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
          全部动作
        </h2>
        <div className="space-y-2">
          {allExercises.map((exercise) => (
            <Card
              key={exercise.id}
              className={`border ${
                exercise.isStarred
                  ? "border-[#FFEAA7]/50"
                  : "border-border"
              }`}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#FFB7B2]/10 flex-shrink-0">
                  <img
                    src={exercise.imageUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">{exercise.name}</span>
                    {exercise.isStarred && (
                      <Star className="w-3 h-3 fill-[#FFEAA7] text-[#F0D56E]" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {exercise.description}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-extrabold">
                    {exercise.totalCount}
                  </div>
                  <div className="text-[10px] text-muted-foreground">次</div>
                </div>
                <button
                  onClick={() =>
                    toggleStarMutation.mutate({ exerciseId: exercise.id })
                  }
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-4 h-4 ${
                      exercise.isStarred
                        ? "fill-[#FFEAA7] text-[#F0D56E]"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
