import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { recipientPreviewSchema } from "@/lib/validations/campaign";
import { queryUsersWithFilter } from "@/lib/db/queries/campaign";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

type RecipientPreview = {
  id: string;
  name: string;
  email: string;
  applicationStatus: string;
  rsvpAt: Date | null;
  role: string;
};

type PreviewResult = {
  count: number;
  recipients: RecipientPreview[];
  hasMore: boolean;
};

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<PreviewResult>>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validation = recipientPreviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid filter criteria",
          error: validation.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }

    const matchingUsers = await queryUsersWithFilter(validation.data);
    const previewLimit = 20;

    return NextResponse.json({
      success: true,
      message: "Recipients preview generated",
      data: {
        count: matchingUsers.length,
        recipients: matchingUsers.slice(0, previewLimit),
        hasMore: matchingUsers.length > previewLimit,
      },
    });
  } catch (error) {
    console.error("Error generating recipients preview:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
