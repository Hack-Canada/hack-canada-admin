import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { bannerSchema } from "@/lib/validations/banner";
import {
  getBannerById,
  updateBanner,
  deleteBanner,
} from "@/lib/db/queries/banner";
import { createAuditLog } from "@/lib/db/queries/audit-log";
import type { ApiResponse } from "@/types/api";
import type { Banner } from "@/lib/db/schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<Banner>>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const existing = await getBannerById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const validation = bannerSchema.partial().safeParse(body);

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
      ...(validation.data.linkUrl !== undefined && {
        linkUrl: validation.data.linkUrl || null,
      }),
      ...(validation.data.linkText !== undefined && {
        linkText: validation.data.linkText || null,
      }),
      ...(validation.data.expiresAt !== undefined && {
        expiresAt: validation.data.expiresAt || null,
      }),
    };

    const updated = await updateBanner(id, data);

    await createAuditLog({
      userId: user.id,
      action: "update",
      entityType: "banner",
      entityId: id,
      previousValue: {
        type: existing.type,
        message: existing.message,
        isActive: existing.isActive,
      },
      newValue: data,
      metadata: {
        description: `${user.name || user.email} updated banner "${existing.message.slice(0, 50)}${existing.message.length > 50 ? "..." : ""}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Banner updated successfully",
      data: updated!,
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const existing = await getBannerById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 },
      );
    }

    await deleteBanner(id);

    await createAuditLog({
      userId: user.id,
      action: "delete",
      entityType: "banner",
      entityId: id,
      previousValue: {
        type: existing.type,
        message: existing.message,
        isActive: existing.isActive,
      },
      metadata: {
        description: `${user.name || user.email} deleted banner "${existing.message.slice(0, 50)}${existing.message.length > 50 ? "..." : ""}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
