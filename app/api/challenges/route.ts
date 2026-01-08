import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";

import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { challengeSchema } from "@/lib/validations/challenge";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const validationResult = challengeSchema.safeParse(body);

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

    await db.insert(challenges).values({
      ...data,
      maxCompletions: data.maxCompletions || null,
      hints: data.hints || [],
    });

    return NextResponse.json({
      success: true,
      message: "Challenge created successfully",
    });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
