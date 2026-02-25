"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useState } from "react";

const chartConfig = {
  applicants: {
    label: "Applicants",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

type Props = {
  data: {
    level: string | null;
    applicants: number;
  }[];
};

export default function LevelOfStudyBarChart({ data }: Props) {
  const [listView, setListView] = useState(false);

  const sortedData = [...data].sort((a, b) => b.applicants - a.applicants);

  return (
    <>
      <div className="flex justify-between max-sm:flex-col max-sm:justify-normal">
        <div>
          <p className="mb-1 text-xl font-semibold text-foreground md:text-2xl">
            Level of Study
          </p>
          <p className="text-xs text-muted-foreground md:text-sm">
            Distribution of applicants by education level
          </p>
        </div>
        <div className="mt-2 flex h-fit w-fit items-center gap-1 rounded-lg border bg-secondary p-0.5 max-sm:text-sm">
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
      </div>
      {listView ? (
        <div className="mt-4 max-h-[400px] overflow-y-auto md:mt-8">
          <div className="flex flex-col divide-y-2">
            {sortedData.map(({ level, applicants }) => (
              <div
                key={level}
                className="flex justify-between gap-x-2.5 py-2 max-sm:text-sm"
              >
                <p>{level || "Not specified"}</p>
                <p className="shrink-0 font-medium">{applicants}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 h-[350px] w-full overflow-hidden">
          <ChartContainer config={chartConfig} className="!aspect-auto h-full w-full">
            <BarChart
              data={sortedData}
              margin={{ top: 10, right: 10, bottom: 60, left: 10 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="level"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickMargin={8}
                angle={-35}
                textAnchor="end"
                height={70}
                tickFormatter={(v) =>
                  v && v.length > 18 ? v.slice(0, 18) + "..." : v || "N/A"
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={45}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[180px]"
                    nameKey="applicants"
                    labelFormatter={(_v, props) =>
                      props?.[0]?.payload?.level || "Unknown"
                    }
                  />
                }
              />
              <Bar
                dataKey="applicants"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </>
  );
}
