"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus, Users, TrendingDown, TrendingUp, Handshake } from "lucide-react";

interface ReviewerData {
  reviewerId: string;
  reviewerName: string;
  reviewCount: number;
  rawAvgRating: number;
  bias: number;
  stdDev: number;
  normalizedShift: number;
  reliabilityScore: number;
}

interface ReviewerAnalyticsProps {
  reviewers: ReviewerData[];
  globalAvg: number;
  globalStdDev: number;
  harshestReviewer: { name: string; avg: number } | null;
  mostLenientReviewer: { name: string; avg: number } | null;
  avgBias: number;
  agreementRate: number;
}

const getBiasColor = (bias: number) => {
  const absBias = Math.abs(bias);
  if (absBias < 0.5) return "text-green-600 dark:text-green-400";
  if (absBias < 1.0) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

const getReliabilityColor = (score: number) => {
  if (score >= 0.7) return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
  if (score >= 0.4) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400";
  return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
};

export default function ReviewerAnalytics({
  reviewers,
  globalAvg,
  globalStdDev,
  harshestReviewer,
  mostLenientReviewer,
  avgBias,
  agreementRate,
}: ReviewerAnalyticsProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Harshest Reviewer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Harshest Reviewer</CardTitle>
            <TrendingDown className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {harshestReviewer ? (
              <>
                <p className="truncate text-lg font-bold">{harshestReviewer.name}</p>
                <p className="text-sm text-muted-foreground">
                  Avg rating: <span className="font-medium text-red-500">{Number(harshestReviewer.avg).toFixed(1)}</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Most Lenient Reviewer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Lenient Reviewer</CardTitle>
            <TrendingUp className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {mostLenientReviewer ? (
              <>
                <p className="truncate text-lg font-bold">{mostLenientReviewer.name}</p>
                <p className="text-sm text-muted-foreground">
                  Avg rating: <span className="font-medium text-green-500">{Number(mostLenientReviewer.avg).toFixed(1)}</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Average Bias */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Reviewer Bias</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">±{Number(avgBias).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">
              Global avg: {Number(globalAvg).toFixed(2)} (σ: {Number(globalStdDev).toFixed(2)})
            </p>
          </CardContent>
        </Card>

        {/* Agreement Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agreement Rate</CardTitle>
            <Handshake className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Number(agreementRate).toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">
              Apps with rating spread ≤ 2
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Reviewer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviewer Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {reviewers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reviewer</TableHead>
                    <TableHead className="text-center">Reviews</TableHead>
                    <TableHead className="text-center">Raw Avg</TableHead>
                    <TableHead className="text-center">Bias</TableHead>
                    <TableHead className="text-center">Std Dev</TableHead>
                    <TableHead className="text-center">Norm. Shift</TableHead>
                    <TableHead className="text-center">Reliability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewers.map((reviewer) => (
                    <TableRow key={reviewer.reviewerId}>
                      <TableCell className="font-medium">
                        {reviewer.reviewerName}
                      </TableCell>
                      <TableCell className="text-center">
                        {reviewer.reviewCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {reviewer.rawAvgRating.toFixed(1)}
                      </TableCell>
                      <TableCell className={cn("text-center", getBiasColor(reviewer.bias))}>
                        <span className="inline-flex items-center gap-1">
                          {reviewer.bias > 0 ? (
                            <ArrowUp className="size-3" />
                          ) : reviewer.bias < 0 ? (
                            <ArrowDown className="size-3" />
                          ) : (
                            <Minus className="size-3" />
                          )}
                          {reviewer.bias > 0 ? "+" : ""}
                          {reviewer.bias.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {reviewer.stdDev.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            reviewer.normalizedShift > 0
                              ? "text-green-600 dark:text-green-400"
                              : reviewer.normalizedShift < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted-foreground"
                          )}
                        >
                          {reviewer.normalizedShift > 0 ? "+" : ""}
                          {reviewer.normalizedShift.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex min-w-[3rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
                            getReliabilityColor(reviewer.reliabilityScore)
                          )}
                        >
                          {(reviewer.reliabilityScore * 100).toFixed(0)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No reviewers with enough reviews to analyze. Reviewers need at least 3 reviews.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
