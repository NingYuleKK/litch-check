import { useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import WeeklyReviewCard from "@/components/WeeklyReviewCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { domToBlob } from "modern-screenshot";
import { inlineImagesAsBase64 } from "@/lib/imageToBase64";

export default function WeeklyReviewDetail() {
  const params = useParams<{ weekStart: string }>();
  const weekStart = params.weekStart ?? "";

  const { data, isLoading, error } = trpc.weeklyReview.get.useQuery(
    { weekStart },
    { enabled: !!weekStart, refetchOnWindowFocus: false }
  );

  const handleExport = useCallback(async (element: HTMLDivElement) => {
    try {
      toast.info("正在生成图片...");

      // Clone the element to avoid mutating the live DOM
      const clone = element.cloneNode(true) as HTMLDivElement;
      clone.style.position = "fixed";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.width = element.offsetWidth + "px";
      document.body.appendChild(clone);

      // Convert all images to base64 to bypass CORS restrictions
      await inlineImagesAsBase64(clone);

      const blob = await domToBlob(clone, {
        scale: 2,
        backgroundColor: "#FFF5F0",
        features: {
          removeControlCharacter: false,
        },
      });

      // Clean up clone
      document.body.removeChild(clone);

      if (!blob) {
        throw new Error("Failed to generate image blob");
      }

      // Use blob URL for download (more reliable than data URL)
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `weekly-review-${weekStart}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      toast.success("图片已保存！");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("导出失败，请重试");
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
