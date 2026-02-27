import { getCurrentUser } from "@/auth";
import { ApiResponse } from "@/types/api";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/utils";
import {
  normalizeRatings,
  NormalizationResult,
} from "@/lib/normalization/normalize";

export async function POST(): Promise<
  NextResponse<ApiResponse<NormalizationResult>>
> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id || !isAdmin(currentUser.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to perform this action.",
        },
        { status: 403 }
      );
    }

    const result = await normalizeRatings();

    return NextResponse.json({
      success: true,
      message: `Normalization complete. Processed ${result.reviewersProcessed} reviewers and updated ${result.applicationsUpdated} applications.`,
      data: result,
    });
  } catch (error) {
    console.error("[NORMALIZE_RATINGS_POST]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to normalize ratings.",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
