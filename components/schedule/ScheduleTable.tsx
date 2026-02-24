"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ScheduleFormDialog from "./ScheduleFormDialog";
import type { Schedule } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const typeBadgeColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  meals: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  ceremonies: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  workshops: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  fun: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  });
}

interface ScheduleTableProps {
  events: Schedule[];
}

export default function ScheduleTable({ events }: ScheduleTableProps) {
  const router = useRouter();
  const [editEvent, setEditEvent] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {events.length} event{events.length !== 1 && "s"}
        </p>
        <Button onClick={() => setShowCreateDialog(true)}>
          Add Event
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Custom Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No schedule events found. Create your first event to get started.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    {event.eventName}
                    {event.eventDescription && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {event.eventDescription}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        typeBadgeColors[event.type] || "bg-muted text-muted-foreground",
                      )}
                    >
                      {event.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.location || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDateTime(event.startTime)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDateTime(event.endTime)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {event.customTime || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditEvent(event)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(event)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <ScheduleFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Edit Dialog */}
      <ScheduleFormDialog
        open={!!editEvent}
        onOpenChange={(open) => {
          if (!open) setEditEvent(null);
        }}
        event={editEvent ?? undefined}
      />

      {/* Delete Confirmation Dialog */}
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
              Are you sure you want to delete &quot;{deleteTarget?.eventName}&quot;?
              This action cannot be undone and will immediately remove the event
              from the hacker portal schedule.
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
    </>
  );
}
