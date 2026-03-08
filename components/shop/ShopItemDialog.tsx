"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointsCost: number;
  stock: number;
  maxPerUser: number | null;
  enabled: boolean;
}

interface ShopItemDialogProps {
  open: boolean;
  item: ShopItem | null;
  onClose: (refresh?: boolean) => void;
}

export default function ShopItemDialog({
  open,
  item,
  onClose,
}: ShopItemDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pointsCost, setPointsCost] = useState("");
  const [stock, setStock] = useState("");
  const [maxPerUser, setMaxPerUser] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!item;

  useEffect(() => {
    if (open && item) {
      setName(item.name);
      setDescription(item.description || "");
      setImageUrl(item.imageUrl || "");
      setPointsCost(item.pointsCost.toString());
      setStock(item.stock.toString());
      setMaxPerUser(item.maxPerUser?.toString() || "");
      setEnabled(item.enabled);
    } else if (open) {
      setName("");
      setDescription("");
      setImageUrl("");
      setPointsCost("");
      setStock("");
      setMaxPerUser("1");
      setEnabled(true);
    }
  }, [open, item]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    const cost = parseInt(pointsCost);
    if (isNaN(cost) || cost < 1) {
      toast.error("Points cost must be at least 1");
      return;
    }

    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error("Stock cannot be negative");
      return;
    }

    const maxNum = maxPerUser ? parseInt(maxPerUser) : null;
    if (maxPerUser && (isNaN(maxNum!) || maxNum! < 1)) {
      toast.error("Max per user must be at least 1");
      return;
    }

    setSubmitting(true);
    try {
      const url = isEditing ? `/api/admin/shop/${item.id}` : "/api/admin/shop";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          imageUrl: imageUrl.trim() || null,
          pointsCost: cost,
          stock: stockNum,
          maxPerUser: maxNum,
          enabled,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          isEditing ? "Item updated successfully" : "Item created successfully",
        );
        onClose(true);
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      toast.error("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the shop item details."
              : "Add a new item to the points shop."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monster Energy Drink"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the item"
              className="resize-none"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {imageUrl && (
              <div className="mt-2">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-20 w-20 rounded object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pointsCost">Points Cost *</Label>
              <Input
                id="pointsCost"
                type="number"
                min="1"
                value={pointsCost}
                onChange={(e) => setPointsCost(e.target.value)}
                placeholder="50"
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="maxPerUser">Max Per User</Label>
            <Input
              id="maxPerUser"
              type="number"
              min="1"
              value={maxPerUser}
              onChange={(e) => setMaxPerUser(e.target.value)}
              placeholder="1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave empty for unlimited
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enabled</Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
