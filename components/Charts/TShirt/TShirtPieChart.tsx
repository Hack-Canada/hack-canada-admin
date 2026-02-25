"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Cell, Legend, Pie, PieChart } from "recharts";

const chartConfig = {
  count: {
    label: "Count",
  },
  xs: {
    label: "XS",
    color: "hsl(var(--chart-1))",
  },
  s: {
    label: "S",
    color: "hsl(var(--chart-2))",
  },
  m: {
    label: "M",
    color: "hsl(var(--chart-3))",
  },
  l: {
    label: "L",
    color: "hsl(var(--chart-4))",
  },
  xl: {
    label: "XL",
    color: "hsl(var(--chart-5))",
  },
  xxl: {
    label: "XXL",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
];

type Props = {
  data: {
    tShirtSize: string;
    count: number;
  }[];
};

const TShirtPieChart = ({ data }: Props) => {
  const [listView, setListView] = useState(false);

  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const chartData = sortedData.map((d, i) => ({
    ...d,
    color: colors[i % colors.length],
  }));

  return (
    <div className="space-y-6 rounded-lg border p-6 md:p-10">
      <div>
        <p className="mb-1 text-center text-xl font-semibold text-foreground md:text-2xl">
          T-Shirt Sizes
        </p>
        <p className="text-center text-xs text-muted-foreground md:text-sm">
          RSVP t-shirt size distribution
        </p>
      </div>

      <div className="mx-auto mt-2 flex h-fit w-fit items-center gap-1 rounded-lg border bg-secondary p-0.5 text-sm">
        <button
          onClick={() => setListView(false)}
          className={cn("rounded-md px-3 py-1 transition-colors", {
            "bg-background text-foreground": listView === false,
          })}
        >
          Graph
        </button>
        <button
          onClick={() => setListView(true)}
          className={cn("rounded-md px-3 py-1 transition-colors", {
            "bg-background text-foreground": listView === true,
          })}
        >
          List
        </button>
      </div>

      {listView ? (
        <div className="max-h-[300px] overflow-y-auto">
          <div className="flex flex-col divide-y-2">
            {sortedData.map(({ tShirtSize, count }) => (
              <div
                key={tShirtSize}
                className="flex justify-between gap-x-2.5 py-2 max-sm:text-sm"
              >
                <p>{tShirtSize || "Not specified"}</p>
                <p className="shrink-0 font-medium">{count}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="tShirtSize"
              outerRadius={80}
              innerRadius={30}
              paddingAngle={2}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: 16 }}
              formatter={(value) => (
                <span className="text-xs text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ChartContainer>
      )}
    </div>
  );
};
export default TShirtPieChart;
