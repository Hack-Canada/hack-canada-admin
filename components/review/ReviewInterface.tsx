"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HackerApplicationsSelectData } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { RATINGS, useReviewInterface } from "@/hooks/useReviewInterface";

interface ReviewInterfaceProps {
  initialApplication: HackerApplicationsSelectData | null;
}

export default function ReviewInterface({
  initialApplication,
}: ReviewInterfaceProps) {
  const router = useRouter();
  const { rating, setRating, submitting, submitReview } =
    useReviewInterface(initialApplication);

  if (!initialApplication) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No more applications to review!</p>
        <Button
          onClick={() => router.refresh()}
          variant="secondary"
          className="mt-4"
        >
          Check Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold">Rating</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-2 md:grid-cols-11">
        {RATINGS.map((value) => {
          const isSelected = rating === value;
          const zone =
            value <= 3 ? "red" : value <= 7 ? "orange" : "green";
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              disabled={submitting}
              className={cn(
                "h-12 rounded-md border text-lg font-semibold transition-all duration-150",
                value === 10 && "max-md:col-span-2",
                // Red zone 1-3
                zone === "red" && !isSelected &&
                  "border-red-300 text-red-600 hover:border-red-500 hover:bg-red-500 hover:text-white dark:border-red-800 dark:text-red-400 dark:hover:border-red-500 dark:hover:bg-red-600",
                zone === "red" && isSelected &&
                  "scale-105 border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/30 dark:bg-red-600 dark:border-red-600",
                // Orange zone 4-7
                zone === "orange" && !isSelected &&
                  "border-orange-300 text-orange-600 hover:border-orange-500 hover:bg-orange-500 hover:text-white dark:border-orange-800 dark:text-orange-400 dark:hover:border-orange-500 dark:hover:bg-orange-600",
                zone === "orange" && isSelected &&
                  "scale-105 border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/30 dark:bg-orange-600 dark:border-orange-600",
                // Green zone 8-10
                zone === "green" && !isSelected &&
                  "border-green-300 text-green-600 hover:border-green-500 hover:bg-green-500 hover:text-white dark:border-green-800 dark:text-green-400 dark:hover:border-green-500 dark:hover:bg-green-600",
                zone === "green" && isSelected &&
                  "scale-105 border-green-500 bg-green-500 text-white shadow-lg shadow-green-500/30 dark:bg-green-600 dark:border-green-600",
                // Disabled state
                submitting && "cursor-not-allowed opacity-50",
              )}
            >
              {value}
            </button>
          );
        })}
      </div>

      <Button
        onClick={submitReview}
        disabled={submitting || rating === null}
        className="w-full min-w-[140px]"
      >
        <span className="flex items-center justify-center gap-2">
          {submitting && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {submitting ? "Submitting..." : "Submit Review"}
        </span>
      </Button>
    </div>
  );
}
