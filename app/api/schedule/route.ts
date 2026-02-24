import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { scheduleEventSchema } from "@/lib/validations/schedule";
import {
  getAllScheduleEvents,
  createScheduleEvent,
} from "@/lib/db/queries/schedule";
import { createAuditLog } from "@/lib/db/queries/audit-log";
import type { ApiResponse } from "@/types/api";
import type { Schedule } from "@/lib/db/schema";

export async function GET(): Promise<NextResponse<ApiResponse<Schedule[]>>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const events = await getAllScheduleEvents();

    return NextResponse.json({
      success: true,
      message: "Schedule events fetched successfully",
      data: events,
    });
  } catch (error) {
    console.error("Error fetching schedule events:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<Schedule>>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validation = scheduleEventSchema.safeParse(body);

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

    const created = await createScheduleEvent(validation.data);

    await createAuditLog({
      userId: user.id,
      action: "create",
      entityType: "schedule",
      entityId: created.id,
      newValue: validation.data,
      metadata: {
        description: `${user.name || user.email} created schedule event "${created.eventName}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule event created successfully",
      data: created,
    });
  } catch (error) {
    console.error("Error creating schedule event:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
