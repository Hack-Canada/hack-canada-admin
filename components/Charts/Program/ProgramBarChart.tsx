"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";

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
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

type Props = {
  data: {
    major: string | null;
    applicants: number;
  }[];
};

export default function ProgramBarChart({ data }: Props) {
  const [listView, setListView] = useState(false);

  const sortedData = [...data]
    .sort((a, b) => b.applicants - a.applicants)
    .slice(0, 20);

  const chartHeight = Math.max(300, sortedData.length * 32);

  return (
    <>
      <div className="flex justify-between max-sm:flex-col max-sm:justify-normal">
        <div>
          <p className="mb-1 text-xl font-semibold text-foreground md:text-2xl">
            Major Demographic
          </p>
          <p className="text-xs text-muted-foreground md:text-sm">
            Top {sortedData.length} programs by applicant count
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
        <div className="mt-4 max-h-[500px] overflow-y-auto md:mt-8">
          <div className="flex flex-col divide-y-2">
            {[...data].sort((a, b) => b.applicants - a.applicants).map(({ major, applicants }) => (
              <div
                key={major}
                className="flex justify-between gap-x-2.5 py-2 max-sm:text-sm"
              >
                <p className="truncate">{major || "Not specified"}</p>
                <p className="shrink-0 font-medium">{applicants}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 w-full overflow-hidden" style={{ height: Math.min(chartHeight, 500) }}>
          <ChartContainer
            config={chartConfig}
            className="!aspect-auto h-full w-full"
          >
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 40, bottom: 5, left: 10 }}
            >
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                allowDecimals={false}
              />
              <YAxis
                dataKey="major"
                type="category"
                tickLine={false}
                axisLine={false}
                width={150}
                fontSize={11}
                tickFormatter={(v) =>
                  v && v.length > 20 ? v.slice(0, 20) + "..." : v || "N/A"
                }
              />
              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    nameKey="applicants"
                    labelFormatter={(_v, props) =>
                      props?.[0]?.payload?.major || "Unknown"
                    }
                  />
                }
              />
              <Bar
                dataKey="applicants"
                fill="hsl(var(--chart-4))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </>
  );
}
