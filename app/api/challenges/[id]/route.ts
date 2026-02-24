import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { challengeSchema } from "@/lib/validations/challenge";

// We'll use a partial schema for updates so we don't need to send the whole object
const updateChallengeSchema = challengeSchema.partial();

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validationResult = updateChallengeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
          error: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { data } = validationResult;

    await db.update(challenges).set(data).where(eq(challenges.id, params.id));

    return NextResponse.json({
      success: true,
      message: "Challenge updated successfully",
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const currentUser = await getCurrentUser();

    if (
      !currentUser ||
      !(currentUser.role === "admin" || currentUser.role == "organizer")
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await db.delete(challenges).where(eq(challenges.id, params.id));

    return NextResponse.json({
      success: true,
      message: "Challenge deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
