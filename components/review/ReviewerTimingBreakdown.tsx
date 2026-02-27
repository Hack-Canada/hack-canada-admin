"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

const TIME_BUCKETS = [
  { label: "≤5s", min: 0, max: 5 },
  { label: "6–15s", min: 6, max: 15 },
  { label: "16–30s", min: 16, max: 30 },
  { label: "31–60s", min: 31, max: 60 },
  { label: "1–2 min", min: 61, max: 120 },
  { label: "2–5 min", min: 121, max: 300 },
  { label: ">5 min", min: 301, max: Infinity },
] as const;

const chartConfig = {
  percentage: { label: "Percentage", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

interface ReviewerTimingBreakdownProps {
  reviews: { duration: number | null }[];
}

export default function ReviewerTimingBreakdown({
  reviews,
}: ReviewerTimingBreakdownProps) {
  const validDurations = reviews
    .map((r) => r.duration)
    .filter((d): d is number => d !== null && d >= 0);

  const nullCount = reviews.length - validDurations.length;

  if (validDurations.length === 0) {
    return null;
  }

  const bucketCounts = TIME_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: validDurations.filter((d) => d >= bucket.min && d <= bucket.max)
      .length,
  }));

  const total = validDurations.length;
  const chartData = bucketCounts
    .filter((b) => b.count > 0)
    .map((b) => ({
      label: b.label,
      percentage: Math.round((b.count / total) * 100),
      count: b.count,
    }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Review Time Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, bottom: 5, left: 60 }}
          >
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={55}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) =>
                    `${value}% (${item.payload.count} reviews)`
                  }
                />
              }
            />
            <Bar
              dataKey="percentage"
              fill="hsl(var(--chart-1))"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
        {nullCount > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {nullCount} review{nullCount > 1 ? "s" : ""} without recorded
            duration
          </p>
        )}
      </CardContent>
    </Card>
  );
}
