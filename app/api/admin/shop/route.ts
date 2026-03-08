import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import {
  getAllShopItems,
  createShopItem,
  getShopStats,
} from "@/data/shop";
import { z } from "zod";

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
    const includeStats = searchParams.get("includeStats") === "true";

    const items = await getAllShopItems();

    const response: {
      success: boolean;
      data: {
        items: typeof items;
        stats?: Awaited<ReturnType<typeof getShopStats>>;
      };
    } = {
      success: true,
      data: { items },
    };

    if (includeStats) {
      response.data.stats = await getShopStats();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching shop items:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

const createItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  pointsCost: z.number().min(1, "Points cost must be at least 1"),
  stock: z.number().min(0, "Stock cannot be negative"),
  maxPerUser: z.number().min(1).optional(),
  enabled: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validation = createItemSchema.safeParse(body);

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

    const data = validation.data;
    const item = await createShopItem({
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl || undefined,
      pointsCost: data.pointsCost,
      stock: data.stock,
      maxPerUser: data.maxPerUser,
      enabled: data.enabled,
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "Failed to create item" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shop item created successfully",
      data: item,
    });
  } catch (error) {
    console.error("Error creating shop item:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
