import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import {
  getShopItemById,
  updateShopItem,
  deleteShopItem,
  getItemPurchases,
} from "@/data/shop";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const includePurchases = searchParams.get("includePurchases") === "true";

    const item = await getShopItemById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, message: "Item not found" },
        { status: 404 },
      );
    }

    const response: {
      success: boolean;
      data: {
        item: typeof item;
        purchases?: Awaited<ReturnType<typeof getItemPurchases>>;
      };
    } = {
      success: true,
      data: { item },
    };

    if (includePurchases) {
      response.data.purchases = await getItemPurchases(id);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching shop item:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

const updateItemSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal("")),
  pointsCost: z.number().min(1, "Points cost must be at least 1").optional(),
  stock: z.number().min(0, "Stock cannot be negative").optional(),
  maxPerUser: z.number().min(1).nullable().optional(),
  enabled: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateItemSchema.safeParse(body);

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

    const existingItem = await getShopItemById(id);
    if (!existingItem) {
      return NextResponse.json(
        { success: false, message: "Item not found" },
        { status: 404 },
      );
    }

    const data = validation.data;
    const item = await updateShopItem(id, {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl === "" ? null : data.imageUrl,
      pointsCost: data.pointsCost,
      stock: data.stock,
      maxPerUser: data.maxPerUser,
      enabled: data.enabled,
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "Failed to update item" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shop item updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Error updating shop item:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const existingItem = await getShopItemById(id);
    if (!existingItem) {
      return NextResponse.json(
        { success: false, message: "Item not found" },
        { status: 404 },
      );
    }

    const success = await deleteShopItem(id);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to delete item" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shop item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting shop item:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
