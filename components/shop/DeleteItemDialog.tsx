"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShopItem {
  id: string;
  name: string;
  purchaseCount: number;
}

interface DeleteItemDialogProps {
  item: ShopItem | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteItemDialog({
  item,
  onClose,
  onConfirm,
}: DeleteItemDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <AlertDialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Shop Item</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{item?.name}</strong>?
            {item && item.purchaseCount > 0 && (
              <span className="mt-2 block text-destructive">
                Warning: This item has {item.purchaseCount} purchase
                {item.purchaseCount !== 1 ? "s" : ""}. Deleting it will also
                remove all purchase records.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
