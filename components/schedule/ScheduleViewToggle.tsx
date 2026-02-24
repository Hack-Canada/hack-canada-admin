"use client";

import { useState } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ScheduleTable from "./ScheduleTable";
import ScheduleGridView from "./ScheduleGridView";
import type { Schedule } from "@/lib/db/schema";

interface ScheduleViewToggleProps {
  events: Schedule[];
  allEvents: Schedule[];
}

export default function ScheduleViewToggle({
  events,
  allEvents,
}: ScheduleViewToggleProps) {
  const [view, setView] = useState<"grid" | "table">("grid");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 rounded-lg border bg-muted/50 p-1 w-fit">
        <button
          onClick={() => setView("grid")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            view === "grid"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <LayoutGrid className="size-4" />
          Grid View
        </button>
        <button
          onClick={() => setView("table")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            view === "table"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Table2 className="size-4" />
          Table View
        </button>
      </div>

      {view === "grid" ? (
        <ScheduleGridView events={allEvents} />
      ) : (
        <ScheduleTable events={events} />
      )}
    </div>
  );
}
