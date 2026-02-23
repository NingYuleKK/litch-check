import { useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import WeeklyReviewCard from "@/components/WeeklyReviewCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { domToBlob } from "modern-screenshot";
import { imageToBase64 } from "@/lib/imageToBase64";

export default function WeeklyReviewDetail() {
  const params = useParams<{ weekStart: string }>();
  const weekStart = params.weekStart ?? "";

  const { data, isLoading, error } = trpc.weeklyReview.get.useQuery(
    { weekStart },
    { enabled: !!weekStart, refetchOnWindowFocus: false }
  );

  const handleExport = useCallback(async (element: HTMLDivElement) => {
    // Collect all img elements and their original src values
    const imgs = Array.from(element.querySelectorAll<HTMLImageElement>("img"));
    const originalSrcs = imgs.map((img) => img.src);

    try {
      toast.info("正在生成图片...");

      // Temporarily replace img src with base64 to bypass CORS in modern-screenshot
      await Promise.all(
        imgs.map(async (img) => {
          const src = img.getAttribute("src");
          if (!src || src.startsWith("data:")) return;
          const base64 = await imageToBase64(src);
          img.src = base64;
        })
      );

      const blob = await domToBlob(element, {
        scale: 2,
        backgroundColor: "#FFF5F0",
        features: {
          removeControlCharacter: false,
        },
      });

      if (!blob) {
        throw new Error("Failed to generate image blob");
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `weekly-review-${weekStart}.png`;
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
      // Always restore original src values
      imgs.forEach((img, i) => {
        img.src = originalSrcs[i]!;
      });
    }
  }, [weekStart]);

  return (
    <div className="container max-w-lg mx-auto py-6 pb-24">
      {/* Back button */}
      <div className="mb-4">
        <Link href="/weekly-reviews">
          <Button variant="ghost" size="sm" className="gap-1 -ml-2 font-bold">
            <ChevronLeft className="w-4 h-4" />
            历史周报
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-bold">加载失败</p>
          <p className="text-sm mt-1">请稍后重试</p>
        </div>
      )}

      {data && <WeeklyReviewCard data={data} onExport={handleExport} />}

      {!isLoading && !error && !data && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-bold text-lg">暂无数据</p>
          <p className="text-sm mt-1">这周还没有打卡记录</p>
        </div>
      )}
    </div>
  );
}
