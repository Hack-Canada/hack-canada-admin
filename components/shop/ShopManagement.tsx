"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  ShoppingCart,
  Coins,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import ShopItemDialog from "./ShopItemDialog";
import DeleteItemDialog from "./DeleteItemDialog";

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointsCost: number;
  stock: number;
  maxPerUser: number | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  purchaseCount: number;
}

interface Stats {
  totalItems: number;
  enabledItems: number;
  totalPurchases: number;
  totalPointsSpent: number;
}

export default function ShopManagement() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ShopItem | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shop?includeStats=true");
      const data = await res.json();

      if (data.success) {
        setItems(data.data.items);
        if (data.data.stats) {
          setStats(data.data.stats);
        }
      } else {
        toast.error(data.message || "Failed to fetch items");
      }
    } catch (error) {
      toast.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleToggleEnabled = async (item: ShopItem) => {
    try {
      const res = await fetch(`/api/admin/shop/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !item.enabled }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `${item.name} ${!item.enabled ? "enabled" : "disabled"}`,
        );
        fetchItems();
      } else {
        toast.error(data.message || "Failed to update item");
      }
    } catch (error) {
      toast.error("Failed to update item");
    }
  };

  const handleEdit = (item: ShopItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false);
    setEditingItem(null);
    if (refresh) {
      fetchItems();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    try {
      const res = await fetch(`/api/admin/shop/${deleteItem.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Item deleted successfully");
        setDeleteItem(null);
        fetchItems();
      } else {
        toast.error(data.message || "Failed to delete item");
      }
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-blue-100 p-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-green-100 p-3">
                <PackageCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enabled Items</p>
                <p className="text-2xl font-bold">{stats.enabledItems}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-purple-100 p-3">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold">{stats.totalPurchases}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-yellow-100 p-3">
                <Coins className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points Spent</p>
                <p className="text-2xl font-bold">{stats.totalPointsSpent}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Purchased</TableHead>
                <TableHead className="text-center">Enabled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div>
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="mt-1 h-4 w-48" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="mx-auto h-6 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No shop items yet. Click "Add Item" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="max-w-xs truncate text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.pointsCost} pts
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          item.stock === 0
                            ? "font-medium text-destructive"
                            : item.stock < 5
                              ? "font-medium text-yellow-600"
                              : ""
                        }
                      >
                        {item.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.purchaseCount}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={() => handleToggleEnabled(item)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ShopItemDialog
        open={dialogOpen}
        item={editingItem}
        onClose={handleDialogClose}
      />

      <DeleteItemDialog
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
