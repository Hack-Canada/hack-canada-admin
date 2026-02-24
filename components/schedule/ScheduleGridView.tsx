"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import ScheduleFormDialog from "./ScheduleFormDialog";
import type { Schedule } from "@/lib/db/schema";

// --- Constants ---

const DAYS = ["Friday", "Saturday", "Sunday"] as const;
const JS_DAY_MAP = [5, 6, 0]; // Friday=5, Saturday=6, Sunday=0

const DAY_RANGES: Record<number, { start: number; end: number }> = {
  0: { start: 16, end: 24 },
  1: { start: 0, end: 24 },
  2: { start: 0, end: 20 },
};

const SLOT_HEIGHT = 40; // px per 15-min slot
const INTERVAL = 15; // minutes

const EVENT_COLORS: Record<
  string,
  { bg: string; hover: string; border: string; text: string }
> = {
  general: {
    bg: "bg-sky-100 dark:bg-sky-900/40",
    hover: "hover:bg-sky-200 dark:hover:bg-sky-800/50",
    border: "border-sky-300 dark:border-sky-700",
    text: "text-sky-900 dark:text-sky-100",
  },
  meals: {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    hover: "hover:bg-emerald-200 dark:hover:bg-emerald-800/50",
    border: "border-emerald-300 dark:border-emerald-700",
    text: "text-emerald-900 dark:text-emerald-100",
  },
  ceremonies: {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    hover: "hover:bg-amber-200 dark:hover:bg-amber-800/50",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-900 dark:text-amber-100",
  },
  workshops: {
    bg: "bg-violet-100 dark:bg-violet-900/40",
    hover: "hover:bg-violet-200 dark:hover:bg-violet-800/50",
    border: "border-violet-300 dark:border-violet-700",
    text: "text-violet-900 dark:text-violet-100",
  },
  fun: {
    bg: "bg-rose-100 dark:bg-rose-900/40",
    hover: "hover:bg-rose-200 dark:hover:bg-rose-800/50",
    border: "border-rose-300 dark:border-rose-700",
    text: "text-rose-900 dark:text-rose-100",
  },
};

// --- Types ---

interface PendingChange {
  eventId: string;
  newStartTime?: Date;
  newEndTime?: Date;
}

// --- Utility functions ---

function generateTimeSlots(dayIndex: number): string[] {
  const { start, end } = DAY_RANGES[dayIndex];
  const slots: string[] = [];
  for (let hour = start; hour < end; hour++) {
    for (let min = 0; min < 60; min += INTERVAL) {
      const h = hour % 24;
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      slots.push(`${h12}:${min.toString().padStart(2, "0")} ${ampm}`);
    }
  }
  return slots;
}

function getDayEvents(events: Schedule[], dayIndex: number): Schedule[] {
  const jsDay = JS_DAY_MAP[dayIndex];
  return events.filter((e) => new Date(e.startTime).getDay() === jsDay);
}

interface EventPosition {
  event: Schedule;
  column: number;
  totalColumns: number;
}

function calculateEventPositions(
  events: Schedule[],
  dayIndex: number,
): EventPosition[] {
  const { start: dayStart } = DAY_RANGES[dayIndex];
  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const columns: { end: number }[] = [];
  const assignments: { event: Schedule; column: number }[] = [];

  for (const event of sorted) {
    const st = new Date(event.startTime);
    const startSlot =
      (st.getHours() - dayStart) * 4 + Math.floor(st.getMinutes() / INTERVAL);

    const et = new Date(event.endTime);
    const endSlot =
      (et.getHours() - dayStart) * 4 + Math.floor(et.getMinutes() / INTERVAL);

    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      if (columns[c].end <= startSlot) {
        columns[c].end = endSlot;
        assignments.push({ event, column: c });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push({ end: endSlot });
      assignments.push({ event, column: columns.length - 1 });
    }
  }

  return assignments.map(({ event, column }) => {
    const st = new Date(event.startTime);
    const et = new Date(event.endTime);
    const startSlot =
      (st.getHours() - dayStart) * 4 + Math.floor(st.getMinutes() / INTERVAL);
    const endSlot =
      (et.getHours() - dayStart) * 4 + Math.floor(et.getMinutes() / INTERVAL);

    let maxCols = 1;
    for (const other of assignments) {
      if (other.event.id === event.id) continue;
      const os = new Date(other.event.startTime);
      const oe = new Date(other.event.endTime);
      const oStart =
        (os.getHours() - dayStart) * 4 +
        Math.floor(os.getMinutes() / INTERVAL);
      const oEnd =
        (oe.getHours() - dayStart) * 4 +
        Math.floor(oe.getMinutes() / INTERVAL);
      if (oStart < endSlot && oEnd > startSlot) {
        maxCols = Math.max(maxCols, other.column + 1);
      }
    }
    maxCols = Math.max(maxCols, column + 1);

    return { event, column, totalColumns: maxCols };
  });
}

function getEventStyle(
  event: Schedule,
  position: EventPosition,
  dayIndex: number,
) {
  const { start: dayStart } = DAY_RANGES[dayIndex];
  const st = new Date(event.startTime);
  const et = new Date(event.endTime);

  const startSlot =
    (st.getHours() - dayStart) * 4 + Math.floor(st.getMinutes() / INTERVAL);
  const endSlot =
    (et.getHours() - dayStart) * 4 + Math.floor(et.getMinutes() / INTERVAL);
  const duration = Math.max(endSlot - startSlot, 1);

  const colWidth = 100 / position.totalColumns;

  return {
    top: `${startSlot * SLOT_HEIGHT}px`,
    height: `${duration * SLOT_HEIGHT}px`,
    left: `${position.column * colWidth}%`,
    width: `${colWidth}%`,
    position: "absolute" as const,
    zIndex: 10 + position.column,
  };
}

function formatTimeShort(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  });
}

function slotToDate(
  dayIndex: number,
  slotIndex: number,
  referenceEvents: Schedule[],
): Date {
  const jsDay = JS_DAY_MAP[dayIndex];
  const { start: dayStart } = DAY_RANGES[dayIndex];

  const totalMinutes = dayStart * 60 + slotIndex * INTERVAL;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  const ref = referenceEvents.find(
    (e) => new Date(e.startTime).getDay() === jsDay,
  );
  const base = ref ? new Date(ref.startTime) : new Date();
  base.setHours(hour, minute, 0, 0);

  if (!ref) {
    const now = new Date();
    const diff = ((jsDay - now.getDay() + 7) % 7) || 0;
    base.setDate(now.getDate() + diff);
  }

  return base;
}

// --- Component ---

interface ScheduleGridViewProps {
  events: Schedule[];
}

export default function ScheduleGridView({ events }: ScheduleGridViewProps) {
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);

  const [selectedDay, setSelectedDay] = useState(() => {
    const fridayEvents = getDayEvents(events, 0);
    if (fridayEvents.length > 0) return 0;
    const satEvents = getDayEvents(events, 1);
    if (satEvents.length > 0) return 1;
    return 0;
  });

  const [editEvent, setEditEvent] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createStartTime, setCreateStartTime] = useState<Date | undefined>();

  // Pending changes state
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, PendingChange>
  >(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Drag state
  const [dragState, setDragState] = useState<{
    eventId: string;
    mode: "move" | "resize-bottom";
    startY: number;
    originalTop: number;
    originalHeight: number;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState<{
    deltaTop: number;
    deltaHeight: number;
  }>({ deltaTop: 0, deltaHeight: 0 });

  // Apply pending changes to events for display
  const eventsWithPendingChanges = events.map((event) => {
    const change = pendingChanges.get(event.id);
    if (!change) return event;

    return {
      ...event,
      startTime: change.newStartTime || event.startTime,
      endTime: change.newEndTime || event.endTime,
    };
  });

  const timeSlots = generateTimeSlots(selectedDay);
  const dayEvents = getDayEvents(eventsWithPendingChanges, selectedDay);
  const positions = calculateEventPositions(dayEvents, selectedDay);

  const totalGridHeight = timeSlots.length * SLOT_HEIGHT;
  const hasChanges = pendingChanges.size > 0;

  // --- Drag handlers ---

  const handleMouseDown = useCallback(
    (
      e: ReactMouseEvent,
      eventId: string,
      mode: "move" | "resize-bottom",
      currentTop: number,
      currentHeight: number,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState({
        eventId,
        mode,
        startY: e.clientY,
        originalTop: currentTop,
        originalHeight: currentHeight,
      });
      setDragOffset({ deltaTop: 0, deltaHeight: 0 });
    },
    [],
  );

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const deltaY = e.clientY - dragState.startY;
      const snappedDelta = Math.round(deltaY / SLOT_HEIGHT) * SLOT_HEIGHT;

      if (dragState.mode === "move") {
        setDragOffset({ deltaTop: snappedDelta, deltaHeight: 0 });
      } else {
        setDragOffset({
          deltaTop: 0,
          deltaHeight: snappedDelta,
        });
      }
    };

    const handleMouseUp = () => {
      if (!dragState) return;

      const { eventId, mode, originalTop, originalHeight } = dragState;
      const { deltaTop, deltaHeight } = dragOffset;

      if (deltaTop === 0 && deltaHeight === 0) {
        setDragState(null);
        return;
      }

      const event = events.find((e) => e.id === eventId);
      if (!event) {
        setDragState(null);
        return;
      }

      const { start: dayStart } = DAY_RANGES[selectedDay];

      if (mode === "move") {
        const newTopPx = originalTop + deltaTop;
        const newStartSlot = Math.max(0, Math.round(newTopPx / SLOT_HEIGHT));
        const durationSlots = Math.round(originalHeight / SLOT_HEIGHT);

        const newStartMinutes = dayStart * 60 + newStartSlot * INTERVAL;
        const newEndMinutes = newStartMinutes + durationSlots * INTERVAL;

        const newStart = new Date(event.startTime);
        newStart.setHours(
          Math.floor(newStartMinutes / 60),
          newStartMinutes % 60,
          0,
          0,
        );
        const newEnd = new Date(event.endTime);
        newEnd.setHours(
          Math.floor(newEndMinutes / 60),
          newEndMinutes % 60,
          0,
          0,
        );

        setPendingChanges((prev) => {
          const updated = new Map(prev);
          updated.set(eventId, {
            eventId,
            newStartTime: newStart,
            newEndTime: newEnd,
          });
          return updated;
        });
      } else {
        const newHeightPx = Math.max(SLOT_HEIGHT, originalHeight + deltaHeight);
        const newDurationSlots = Math.round(newHeightPx / SLOT_HEIGHT);
        const startSlot = Math.round(originalTop / SLOT_HEIGHT);
        const newEndSlot = startSlot + newDurationSlots;

        const newEndMinutes = dayStart * 60 + newEndSlot * INTERVAL;
        const newEnd = new Date(event.endTime);
        newEnd.setHours(
          Math.floor(newEndMinutes / 60),
          newEndMinutes % 60,
          0,
          0,
        );

        setPendingChanges((prev) => {
          const updated = new Map(prev);
          const existing = prev.get(eventId);
          updated.set(eventId, {
            eventId,
            newStartTime: existing?.newStartTime,
            newEndTime: newEnd,
          });
          return updated;
        });
      }

      setDragState(null);
      setDragOffset({ deltaTop: 0, deltaHeight: 0 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, dragOffset, events, selectedDay]);

  // --- Save/Discard handlers ---

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    const updates = Array.from(pendingChanges.values());

    try {
      const results = await Promise.allSettled(
        updates.map(async (change) => {
          const payload: Record<string, string> = {};
          if (change.newStartTime) {
            payload.startTime = change.newStartTime.toISOString();
          }
          if (change.newEndTime) {
            payload.endTime = change.newEndTime.toISOString();
          }

          const res = await fetch(`/api/schedule/${change.eventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Update failed");
          }
        }),
      );

      const failures = results.filter((r) => r.status === "rejected").length;

      if (failures === 0) {
        toast.success(
          `Successfully updated ${updates.length} event${updates.length > 1 ? "s" : ""}`,
        );
        setPendingChanges(new Map());
        router.refresh();
      } else {
        toast.error(
          `${failures} of ${updates.length} updates failed. Please try again.`,
        );
      }
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setPendingChanges(new Map());
    toast.info("Changes discarded");
  };

  // --- Click empty slot to create ---

  const handleSlotClick = useCallback(
    (slotIndex: number) => {
      if (dragState || hasChanges) return;
      const time = slotToDate(selectedDay, slotIndex, events);
      setCreateStartTime(time);
      setShowCreateDialog(true);
    },
    [selectedDay, events, dragState, hasChanges],
  );

  // --- Delete handler ---

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/schedule/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        router.refresh();
      } else {
        toast.error(data.message || "Failed to delete event");
      }
    } catch {
      toast.error("An error occurred while deleting the event");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Pending changes banner */}
      {hasChanges && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/50">
          <div className="flex items-center gap-2">
            <div className="size-2 animate-pulse rounded-full bg-amber-500" />
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {pendingChanges.size} unsaved change
              {pendingChanges.size > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscardChanges}
              disabled={isSaving}
            >
              <X className="mr-1.5 size-3.5" />
              Discard
            </Button>
            <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
              <Save className="mr-1.5 size-3.5" />
              {isSaving ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Day tabs + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-lg border bg-muted/50 p-1">
          {DAYS.map((day, i) => {
            const count = getDayEvents(events, i).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(i)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-all",
                  selectedDay === i
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {day}
                {count > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        <Button
          onClick={() => setShowCreateDialog(true)}
          size="sm"
          disabled={hasChanges}
        >
          <Plus className="mr-1.5 size-4" />
          Add Event
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card px-4 py-2.5">
        {Object.entries(EVENT_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className={cn(
                "size-3 rounded-sm border",
                colors.bg,
                colors.border,
              )}
            />
            <span className="text-xs capitalize text-muted-foreground">
              {type}
            </span>
          </div>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          Drag to move &middot; Drag bottom edge to resize &middot; Click empty
          slot to create
        </span>
      </div>

      {/* Grid */}
      <div
        className="overflow-x-auto rounded-xl border bg-card shadow-sm"
        style={{ cursor: dragState ? "grabbing" : undefined }}
      >
        <div className="grid min-w-[700px] grid-cols-[80px_1fr] xl:grid-cols-[100px_1fr]">
          {/* Time labels column */}
          <div
            className="border-r bg-muted/30"
            style={{ height: totalGridHeight }}
          >
            {timeSlots.map((label, i) => (
              <div
                key={i}
                className="flex items-start border-b border-border/40 px-2 pt-1"
                style={{ height: SLOT_HEIGHT }}
              >
                {i % 4 === 0 && (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {label}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div
            ref={gridRef}
            className="relative select-none"
            style={{ height: totalGridHeight }}
          >
            {/* Grid lines + clickable slots */}
            {timeSlots.map((_, i) => (
              <div
                key={i}
                onClick={() => handleSlotClick(i)}
                className={cn(
                  "absolute w-full border-b transition-colors",
                  i % 4 === 0 ? "border-border/60" : "border-border/20",
                  !dragState && !hasChanges
                    ? "cursor-pointer hover:bg-primary/5"
                    : "cursor-not-allowed",
                )}
                style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
              />
            ))}

            {/* Event cards */}
            {positions.map((pos) => {
              const style = getEventStyle(pos.event, pos, selectedDay);
              const colors =
                EVENT_COLORS[pos.event.type] || EVENT_COLORS.general;
              const isDragging = dragState?.eventId === pos.event.id;
              const hasChange = pendingChanges.has(pos.event.id);

              const topPx = parseFloat(style.top);
              const heightPx = parseFloat(style.height);

              const displayTop = isDragging ? topPx + dragOffset.deltaTop : topPx;
              const displayHeight = isDragging
                ? Math.max(SLOT_HEIGHT, heightPx + dragOffset.deltaHeight)
                : heightPx;

              return (
                <div
                  key={pos.event.id}
                  className={cn(
                    "absolute rounded-md border px-2 py-1.5 overflow-hidden transition-shadow group",
                    colors.bg,
                    colors.border,
                    colors.text,
                    !isDragging && colors.hover,
                    isDragging &&
                      "shadow-lg ring-2 ring-primary/40 opacity-90 z-50",
                    hasChange && !isDragging && "ring-2 ring-amber-400/50",
                  )}
                  style={{
                    ...style,
                    top: `${displayTop}px`,
                    height: `${displayHeight}px`,
                    zIndex: isDragging ? 100 : style.zIndex,
                    cursor: isDragging ? "grabbing" : "grab",
                    padding: "4px 8px",
                  }}
                  onMouseDown={(e) =>
                    handleMouseDown(e, pos.event.id, "move", topPx, heightPx)
                  }
                >
                  {/* Event content */}
                  <div className="flex h-full flex-col justify-between overflow-hidden">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold leading-tight">
                        {pos.event.eventName}
                      </p>
                      {displayHeight > SLOT_HEIGHT && pos.event.location && (
                        <p className="mt-0.5 truncate text-[10px] opacity-70">
                          {pos.event.location}
                        </p>
                      )}
                    </div>
                    {displayHeight > SLOT_HEIGHT * 1.5 && (
                      <p className="truncate text-[10px] opacity-60">
                        {pos.event.customTime ||
                          `${formatTimeShort(pos.event.startTime)} - ${formatTimeShort(pos.event.endTime)}`}
                      </p>
                    )}
                  </div>

                  {/* Action buttons (visible on hover) */}
                  <div
                    className="absolute right-1 top-1 flex gap-0.5 rounded bg-background/80 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      className="rounded p-0.5 hover:bg-muted"
                      disabled={hasChanges}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!hasChanges) setEditEvent(pos.event);
                      }}
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      className="rounded p-0.5 text-destructive hover:bg-destructive/10"
                      disabled={hasChanges}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!hasChanges) setDeleteTarget(pos.event);
                      }}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>

                  {/* Resize handle (bottom edge) */}
                  <div
                    className="absolute bottom-0 left-0 right-0 flex h-3 cursor-ns-resize items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(
                        e,
                        pos.event.id,
                        "resize-bottom",
                        topPx,
                        heightPx,
                      );
                    }}
                  >
                    <GripVertical className="size-3 rotate-90 text-current opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ScheduleFormDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setCreateStartTime(undefined);
        }}
        defaultStartTime={createStartTime}
      />

      <ScheduleFormDialog
        open={!!editEvent}
        onOpenChange={(open) => {
          if (!open) setEditEvent(null);
        }}
        event={editEvent ?? undefined}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.eventName}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
