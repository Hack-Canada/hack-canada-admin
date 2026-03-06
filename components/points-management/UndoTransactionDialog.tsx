"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PointsTransactionMetadata } from "@/data/points-admin";

interface Transaction {
  transaction: {
    id: string;
    userId: string;
    points: number;
    createdAt: string;
    referenceId: string | null;
    metadata: PointsTransactionMetadata | null;
  };
  userName: string;
  userEmail: string;
}

interface UndoTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: (success: boolean) => void;
}

export default function UndoTransactionDialog({
  transaction,
  open,
  onClose,
}: UndoTransactionDialogProps) {
  const [deleteRelated, setDeleteRelated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleUndo = async () => {
    if (!transaction) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/points/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.transaction.id,
          deleteRelated,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setDeleteRelated(false);
        onClose(true);
      } else {
        toast.error(data.message || "Failed to undo transaction");
      }
    } catch (error) {
      toast.error("Failed to undo transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionTypeLabel = (
    metadata: PointsTransactionMetadata | null,
  ) => {
    if (!metadata?.type) return "Unknown transaction";
    switch (metadata.type) {
      case "challenge_completion":
        return `Challenge completion${metadata.challengeName ? `: ${metadata.challengeName}` : ""}`;
      case "shop_redemption":
        return `Shop redemption${metadata.itemName ? `: ${metadata.itemName}` : ""}`;
      case "admin_adjustment":
        return `Admin adjustment${metadata.reason ? `: ${metadata.reason}` : ""}`;
      default:
        return metadata.type;
    }
  };

  const canDeleteRelated =
    transaction?.transaction.referenceId &&
    (transaction?.transaction.metadata?.type === "challenge_completion" ||
      transaction?.transaction.metadata?.type === "shop_redemption");

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        setDeleteRelated(false);
        onClose(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Undo Transaction</DialogTitle>
          <DialogDescription>
            This will create a reversal transaction to undo the points change.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">User</span>
                <span className="font-medium">{transaction.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm">
                  {getTransactionTypeLabel(transaction.transaction.metadata)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Points</span>
                <span
                  className={`font-mono font-medium ${
                    transaction.transaction.points > 0
                      ? "text-green-600"
                      : "text-destructive"
                  }`}
                >
                  {transaction.transaction.points > 0 ? "+" : ""}
                  {transaction.transaction.points}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="text-sm">
                  {formatDate(transaction.transaction.createdAt)}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">This will:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>
                      {transaction.transaction.points > 0 ? "Remove" : "Add"}{" "}
                      {Math.abs(transaction.transaction.points)} points{" "}
                      {transaction.transaction.points > 0 ? "from" : "to"}{" "}
                      {transaction.userName}
                    </li>
                    <li>Create an undo record in the transaction history</li>
                    {deleteRelated && canDeleteRelated && (
                      <li className="text-red-700 font-medium">
                        Delete the related{" "}
                        {transaction.transaction.metadata?.type ===
                        "challenge_completion"
                          ? "challenge completion"
                          : "shop purchase"}{" "}
                        record
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {canDeleteRelated && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="deleteRelated"
                  checked={deleteRelated}
                  onCheckedChange={(checked) =>
                    setDeleteRelated(checked === true)
                  }
                />
                <Label htmlFor="deleteRelated" className="cursor-pointer">
                  Also delete the{" "}
                  {transaction.transaction.metadata?.type ===
                  "challenge_completion"
                    ? "challenge completion"
                    : "shop purchase"}{" "}
                  record
                </Label>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setDeleteRelated(false);
              onClose(false);
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleUndo}
            disabled={submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Undo Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
