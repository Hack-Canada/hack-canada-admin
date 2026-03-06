import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import {
  getCheckedInUsersWithBalance,
  getNumCheckedInUsersWithBalance,
  getUserPointsInfo,
} from "@/data/points-admin";
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
    const search = searchParams.get("search") || undefined;
    const userId = searchParams.get("userId") || undefined;

    if (userId) {
      const userInfo = await getUserPointsInfo(userId);
      if (!userInfo) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        data: userInfo,
      });
    }

    const offset = (page - 1) * RESULTS_PER_PAGE;
    const filters = { search };

    const [users, total] = await Promise.all([
      getCheckedInUsersWithBalance(offset, filters),
      getNumCheckedInUsersWithBalance(filters),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        total,
        page,
        totalPages: Math.ceil(total / RESULTS_PER_PAGE),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
