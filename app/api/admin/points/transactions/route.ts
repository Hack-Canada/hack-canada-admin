import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import {
  getPointsTransactions,
  getNumPointsTransactions,
  getPointsStats,
  type TransactionFilters,
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
    const userId = searchParams.get("userId") || undefined;
    const type = searchParams.get("type") || undefined;
    const minPoints = searchParams.get("minPoints");
    const maxPoints = searchParams.get("maxPoints");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const includeStats = searchParams.get("includeStats") === "true";

    const offset = (page - 1) * RESULTS_PER_PAGE;
    const filters: TransactionFilters = {
      userId,
      type,
      minPoints: minPoints ? parseInt(minPoints) : undefined,
      maxPoints: maxPoints ? parseInt(maxPoints) : undefined,
      startDate,
      endDate,
    };

    const [transactions, total] = await Promise.all([
      getPointsTransactions(offset, filters),
      getNumPointsTransactions(filters),
    ]);

    const response: {
      success: boolean;
      data: {
        transactions: typeof transactions;
        total: number;
        page: number;
        totalPages: number;
        stats?: Awaited<ReturnType<typeof getPointsStats>>;
      };
    } = {
      success: true,
      data: {
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / RESULTS_PER_PAGE),
      },
    };

    if (includeStats) {
      response.data.stats = await getPointsStats();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
