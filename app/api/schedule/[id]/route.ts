import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { scheduleEventSchema } from "@/lib/validations/schedule";
import {
  getScheduleEventById,
  updateScheduleEvent,
  deleteScheduleEvent,
} from "@/lib/db/queries/schedule";
import { createAuditLog } from "@/lib/db/queries/audit-log";
import type { ApiResponse } from "@/types/api";
import type { Schedule } from "@/lib/db/schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<Schedule>>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = params;
    const existing = await getScheduleEventById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Schedule event not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const validation = scheduleEventSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
          error: validation.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }

    const updated = await updateScheduleEvent(id, validation.data);

    await createAuditLog({
      userId: user.id,
      action: "update",
      entityType: "schedule",
      entityId: id,
      previousValue: {
        eventName: existing.eventName,
        type: existing.type,
        location: existing.location,
        startTime: existing.startTime,
        endTime: existing.endTime,
      },
      newValue: validation.data,
      metadata: {
        description: `${user.name || user.email} updated schedule event "${existing.eventName}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule event updated successfully",
      data: updated!,
    });
  } catch (error) {
    console.error("Error updating schedule event:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = params;
    const existing = await getScheduleEventById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Schedule event not found" },
        { status: 404 },
      );
    }

    await deleteScheduleEvent(id);

    await createAuditLog({
      userId: user.id,
      action: "delete",
      entityType: "schedule",
      entityId: id,
      previousValue: {
        eventName: existing.eventName,
        type: existing.type,
        location: existing.location,
        startTime: existing.startTime,
        endTime: existing.endTime,
      },
      metadata: {
        description: `${user.name || user.email} deleted schedule event "${existing.eventName}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Schedule event "${existing.eventName}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting schedule event:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
