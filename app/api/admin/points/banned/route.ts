import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { getBannedUsers, getNumBannedUsers } from "@/data/points-admin";
import { RESULTS_PER_PAGE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const offset = (page - 1) * RESULTS_PER_PAGE;

    const [bannedUsers, total] = await Promise.all([
      getBannedUsers(offset),
      getNumBannedUsers(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        bannedUsers,
        total,
        page,
        totalPages: Math.ceil(total / RESULTS_PER_PAGE),
      },
    });
  } catch (error) {
    console.error("Error fetching banned users:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
