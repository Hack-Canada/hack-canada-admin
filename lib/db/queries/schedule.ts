import { eq, asc, sql } from "drizzle-orm";
import { db } from "..";
import { schedule, type NewSchedule } from "../schema";

export async function getAllScheduleEvents() {
  return await db
    .select()
    .from(schedule)
    .orderBy(asc(schedule.startTime));
}

export async function getScheduleEventById(id: string) {
  const [event] = await db
    .select()
    .from(schedule)
    .where(eq(schedule.id, id));
  return event ?? null;
}

export async function createScheduleEvent(
  data: Omit<NewSchedule, "id" | "createdAt" | "updatedAt">,
) {
  const [created] = await db.insert(schedule).values(data).returning();
  return created;
}

export async function updateScheduleEvent(
  id: string,
  data: Partial<Omit<NewSchedule, "id" | "createdAt" | "updatedAt">>,
) {
  const [updated] = await db
    .update(schedule)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schedule.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteScheduleEvent(id: string) {
  await db.delete(schedule).where(eq(schedule.id, id));
  return true;
}

export async function getNumScheduleEvents() {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schedule);
  return Number(result.count);
}
