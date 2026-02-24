import { z } from "zod";

export const scheduleEventSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  eventDescription: z.string().nullable().optional(),
  type: z.enum(["general", "meals", "ceremonies", "workshops", "fun"]),
  location: z.string().nullable().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  customTime: z.string().nullable().optional(),
});

export type ScheduleEventInput = z.infer<typeof scheduleEventSchema>;
