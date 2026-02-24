"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  scheduleEventSchema,
  type ScheduleEventInput,
} from "@/lib/validations/schedule";
import type { Schedule } from "@/lib/db/schema";

const EVENT_TYPES = [
  { value: "general", label: "General" },
  { value: "meals", label: "Meals" },
  { value: "ceremonies", label: "Ceremonies" },
  { value: "workshops", label: "Workshops" },
  { value: "fun", label: "Fun" },
] as const;

function toLocalDatetimeString(date: Date | string): string {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

const EMPTY_VALUES: ScheduleEventInput = {
  eventName: "",
  eventDescription: "",
  type: "general",
  location: "",
  startTime: undefined as unknown as Date,
  endTime: undefined as unknown as Date,
  customTime: "",
};

function eventToFormValues(event: Schedule): ScheduleEventInput {
  return {
    eventName: event.eventName,
    eventDescription: event.eventDescription ?? "",
    type: event.type as ScheduleEventInput["type"],
    location: event.location ?? "",
    startTime: new Date(event.startTime),
    endTime: new Date(event.endTime),
    customTime: event.customTime ?? "",
  };
}

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Schedule;
  defaultStartTime?: Date;
}

export default function ScheduleFormDialog({
  open,
  onOpenChange,
  event,
  defaultStartTime,
}: ScheduleFormDialogProps) {
  const router = useRouter();
  const isEditing = !!event;

  const form = useForm<ScheduleEventInput>({
    resolver: zodResolver(scheduleEventSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    if (event) {
      form.reset(eventToFormValues(event));
    } else {
      const base = defaultStartTime ? new Date(defaultStartTime) : undefined;
      const end = base ? new Date(base.getTime() + 60 * 60 * 1000) : undefined;
      form.reset({
        ...EMPTY_VALUES,
        ...(base && { startTime: base }),
        ...(end && { endTime: end }),
      });
    }
  }, [open, event, defaultStartTime, form]);

  async function onSubmit(values: ScheduleEventInput) {
    try {
      const url = isEditing ? `/api/schedule/${event!.id}` : "/api/schedule";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Event" : "Create Event"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the schedule event details below."
              : "Fill in the details to add a new event to the schedule."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Opening Ceremony" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="A brief description of the event..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="LH1001, Atrium, Online..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={
                          field.value
                            ? toLocalDatetimeString(field.value)
                            : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? new Date(val) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={
                          field.value
                            ? toLocalDatetimeString(field.value)
                            : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? new Date(val) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Time Display (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. "Starting 8:30 PM" or "11:15 PM - 12:15 AM"'
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
