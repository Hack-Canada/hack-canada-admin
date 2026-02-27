"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

const PROGRESS_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
];

const ratingChartConfig = {
  count: { label: "Reviews", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

interface ReviewProgressItem {
  reviewCount: number;
  count: number;
}

interface RatingHistogramItem {
  rating: number;
  count: number;
}

interface ReviewSpeedData {
  median: number | null;
  average: number | null;
  min: number | null;
  max: number | null;
  total: number;
  speedClickers: number;
}

interface ReviewerAgreementItem {
  spread: number;
}

interface ReviewPipelineStatsProps {
  reviewProgress: ReviewProgressItem[];
  ratingHistogram: RatingHistogramItem[];
  reviewSpeed: ReviewSpeedData;
  reviewerAgreement: ReviewerAgreementItem[];
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "N/A";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function ReviewPipelineStats({
  reviewProgress,
  ratingHistogram,
  reviewSpeed,
  reviewerAgreement,
}: ReviewPipelineStatsProps) {
  const totalApps = reviewProgress.reduce((sum, r) => sum + Number(r.count), 0);

  const progressWithPct = reviewProgress.map((r) => ({
    ...r,
    percentage: totalApps > 0 ? (Number(r.count) / totalApps) * 100 : 0,
  }));

  const fullRatingHistogram = Array.from({ length: 11 }, (_, i) => {
    const found = ratingHistogram.find((r) => r.rating === i);
    return { rating: i, count: found?.count ?? 0 };
  });

  const highAgreement = reviewerAgreement.filter((r) => r.spread <= 2).length;
  const moderate = reviewerAgreement.filter(
    (r) => r.spread >= 3 && r.spread <= 4
  ).length;
  const controversial = reviewerAgreement.filter((r) => r.spread >= 5).length;
  const totalWithMultiple = reviewerAgreement.length;

  const speedClickerPct =
    reviewSpeed.total > 0
      ? ((reviewSpeed.speedClickers / reviewSpeed.total) * 100).toFixed(1)
      : "0";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Card 1: Review Progress Distribution */}
      <div className="rounded-lg border p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Review Progress Distribution
        </p>
        {totalApps > 0 ? (
          <>
            <div className="mb-3 flex h-4 overflow-hidden rounded-full">
              {progressWithPct.map((r, i) => (
                <div
                  key={r.reviewCount}
                  className="transition-all"
                  style={{
                    width: `${r.percentage}%`,
                    backgroundColor: PROGRESS_COLORS[r.reviewCount] || PROGRESS_COLORS[0],
                  }}
                  title={`${r.reviewCount} reviews: ${r.count} apps (${r.percentage.toFixed(1)}%)`}
                />
              ))}
            </div>
            <div className="space-y-1.5">
              {progressWithPct.map((r) => (
                <Link
                  key={r.reviewCount}
                  href={`/statistics/review-drill?view=progress&filter=${r.reviewCount}`}
                  className="flex items-center justify-between rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{
                        backgroundColor:
                          PROGRESS_COLORS[r.reviewCount] || PROGRESS_COLORS[0],
                      }}
                    />
                    {r.reviewCount} review{r.reviewCount !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5 tabular-nums text-muted-foreground">
                    {r.count} ({r.percentage.toFixed(1)}%)
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No submitted applications</p>
        )}
      </div>

      {/* Card 2: Rating Distribution */}
      <div className="rounded-lg border p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Rating Distribution
        </p>
        {ratingHistogram.length > 0 ? (
          <ChartContainer config={ratingChartConfig} className="h-[180px] w-full">
            <BarChart
              data={fullRatingHistogram}
              margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
            >
              <XAxis
                dataKey="rating"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickMargin={4}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={30}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${value} reviews`}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--chart-1))"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        )}
      </div>

      {/* Card 3: Review Speed */}
      <div className="rounded-lg border p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Review Speed
        </p>
        {reviewSpeed.total > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Median</p>
                <p className="text-lg font-semibold">
                  {formatDuration(reviewSpeed.median)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-lg font-semibold">
                  {formatDuration(reviewSpeed.average)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fastest</p>
                <p className="text-sm font-medium">
                  {formatDuration(reviewSpeed.min)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Slowest</p>
                <p className="text-sm font-medium">
                  {formatDuration(reviewSpeed.max)}
                </p>
              </div>
            </div>
            <Link
              href="/statistics/review-drill?view=speed&filter=under10"
              className="flex items-center justify-between rounded-md bg-muted/50 p-2.5 transition-colors hover:bg-muted"
            >
              <p className="text-xs">
                <span className="font-medium">{speedClickerPct}%</span>{" "}
                <span className="text-muted-foreground">
                  of reviews done in under 10 seconds ({reviewSpeed.speedClickers}{" "}
                  / {reviewSpeed.total})
                </span>
              </p>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              href="/statistics/review-drill?view=speed&filter=all"
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all reviews by duration
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No review data</p>
        )}
      </div>

      {/* Card 4: Reviewer Agreement */}
      <div className="rounded-lg border p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Reviewer Agreement
        </p>
        {totalWithMultiple > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Rating spread on apps with 2+ reviews
            </p>
            <div className="space-y-2">
              <Link
                href="/statistics/review-drill?view=agreement&filter=high"
                className="flex items-center justify-between rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
                  High agreement (spread ≤2)
                </span>
                <span className="flex items-center gap-1.5 tabular-nums text-muted-foreground">
                  {highAgreement} (
                  {((highAgreement / totalWithMultiple) * 100).toFixed(1)}%)
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </span>
              </Link>
              <Link
                href="/statistics/review-drill?view=agreement&filter=moderate"
                className="flex items-center justify-between rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-yellow-500" />
                  Moderate (spread 3-4)
                </span>
                <span className="flex items-center gap-1.5 tabular-nums text-muted-foreground">
                  {moderate} (
                  {((moderate / totalWithMultiple) * 100).toFixed(1)}%)
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </span>
              </Link>
              <Link
                href="/statistics/review-drill?view=agreement&filter=controversial"
                className="flex items-center justify-between rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />
                  Controversial (spread 5+)
                </span>
                <span className="flex items-center gap-1.5 tabular-nums text-muted-foreground">
                  {controversial} (
                  {((controversial / totalWithMultiple) * 100).toFixed(1)}%)
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </span>
              </Link>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full">
              {highAgreement > 0 && (
                <div
                  className="bg-green-500"
                  style={{
                    width: `${(highAgreement / totalWithMultiple) * 100}%`,
                  }}
                />
              )}
              {moderate > 0 && (
                <div
                  className="bg-yellow-500"
                  style={{
                    width: `${(moderate / totalWithMultiple) * 100}%`,
                  }}
                />
              )}
              {controversial > 0 && (
                <div
                  className="bg-red-500"
                  style={{
                    width: `${(controversial / totalWithMultiple) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No apps with multiple reviews yet
          </p>
        )}
      </div>
    </div>
  );
}
