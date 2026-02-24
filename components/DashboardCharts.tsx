"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";

const statusColors: Record<string, string> = {
  pending: "hsl(var(--chart-1))",
  accepted: "hsl(var(--chart-2))",
  rejected: "hsl(var(--chart-3))",
  waitlisted: "hsl(var(--chart-4))",
  cancelled: "hsl(var(--chart-5))",
};

const statusChartConfig = {
  count: { label: "Count" },
  pending: { label: "Pending", color: "hsl(var(--chart-1))" },
  accepted: { label: "Accepted", color: "hsl(var(--chart-2))" },
  rejected: { label: "Rejected", color: "hsl(var(--chart-3))" },
  waitlisted: { label: "Waitlisted", color: "hsl(var(--chart-4))" },
  cancelled: { label: "Cancelled", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const reviewChartConfig = {
  count: { label: "Reviews", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

type StatusData = {
  status: string;
  count: number;
};

type ReviewTrend = {
  date: string;
  count: number;
};

type Props = {
  statusData: StatusData[];
  reviewTrend: ReviewTrend[];
};

const DashboardCharts = ({ statusData, reviewTrend }: Props) => {
  const pieData = statusData.map((d) => ({
    ...d,
    fill: statusColors[d.status] || "hsl(var(--chart-1))",
  }));

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Application Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={statusChartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={pieData} dataKey="count" nameKey="status" label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {reviewTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reviews (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={reviewChartConfig} className="h-[250px]">
              <BarChart data={reviewTrend}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardCharts;
