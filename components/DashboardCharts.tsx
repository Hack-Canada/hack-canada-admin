"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
} from "recharts";

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
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={pieData}
                dataKey="count"
                nameKey="status"
                outerRadius={80}
                innerRadius={30}
                paddingAngle={2}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(value) => (
                  <span className="text-xs capitalize text-foreground">
                    {value}
                  </span>
                )}
              />
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
            <ChartContainer config={reviewChartConfig} className="h-[300px]">
              <BarChart
                data={reviewTrend}
                margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
              >
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickMargin={8}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={40}
                  tickMargin={4}
                  allowDecimals={false}
                />
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
