import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { bannerSchema } from "@/lib/validations/banner";
import { getAllBanners, createBanner } from "@/lib/db/queries/banner";
import { createAuditLog } from "@/lib/db/queries/audit-log";
import type { ApiResponse } from "@/types/api";
import type { Banner } from "@/lib/db/schema";

export async function GET(): Promise<NextResponse<ApiResponse<Banner[]>>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const banners = await getAllBanners();

    return NextResponse.json({
      success: true,
      message: "Banners fetched successfully",
      data: banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<Banner>>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validation = bannerSchema.safeParse(body);

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

    const data = {
      ...validation.data,
      linkUrl: validation.data.linkUrl || null,
      linkText: validation.data.linkText || null,
      expiresAt: validation.data.expiresAt || null,
    };

    const created = await createBanner(data);

    await createAuditLog({
      userId: user.id,
      action: "create",
      entityType: "banner",
      entityId: created.id,
      newValue: data,
      metadata: {
        description: `${user.name || user.email} created banner "${created.message.slice(0, 50)}${created.message.length > 50 ? "..." : ""}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Banner created successfully",
      data: created,
    });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
