"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

type Props = {
  data: {
    race: string | null;
    count: number;
  }[];
};

const RaceBarChart = ({ data }: Props) => {
  const [listView, setListView] = useState(false);

  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <>
      <div className="space-y-6 rounded-lg border p-6 md:p-10">
        <div className="flex justify-between max-sm:flex-col max-sm:justify-normal">
          {/* Title and Date Range */}
          <div>
            <p className="mb-1 text-xl font-semibold text-foreground md:text-2xl">
              Race / Ethnicity
            </p>
            <p className="text-xs text-muted-foreground md:text-sm">
              Distribution of applicants by race / ethnicity
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="mx-auto mt-2 flex h-fit w-fit items-center gap-1 rounded-lg border bg-secondary p-0.5 text-sm">
              <button
                aria-label="Show Graph View"
                onClick={() => setListView(false)}
                className={cn("rounded-md px-3 py-1 transition-colors", {
                  "bg-background text-foreground": listView === false,
                })}
              >
                Graph
              </button>
              <button
                aria-label="Show List View"
                onClick={() => setListView(true)}
                className={cn("rounded-md px-3 py-1 transition-colors", {
                  "bg-background text-foreground": listView === true,
                })}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {listView ? (
          <div className="max-h-[400px] overflow-y-auto">
            <div className="flex flex-col divide-y-2">
              {sortedData.map(({ race, count }) => (
                <div
                  key={race}
                  className="flex justify-between gap-x-2.5 py-2 max-sm:text-sm"
                >
                  <p title={`Race: ${race}`}>{race || "Not specified"}</p>
                  <p className="shrink-0 font-medium" title={`Count: ${count}`}>{count}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[350px] w-full overflow-hidden">
            <ChartContainer config={chartConfig} className="!aspect-auto h-full w-full">
              <BarChart
                data={sortedData}
                layout="vertical"
                margin={{ top: 5, right: 30, bottom: 5, left: 10 }}
              >
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="race"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  width={120}
                  fontSize={11}
                  tickFormatter={(v) =>
                    v && v.length > 16 ? v.slice(0, 16) + "..." : v || "N/A"
                  }
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  content={
                    <ChartTooltipContent
                      nameKey="race"
                      labelFormatter={(v) => v}
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  fill={chartConfig.count.color}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </>
  );
};

export default RaceBarChart;
