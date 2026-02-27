"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CriteriaConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchingCount: number;
  matchingUserIds: string[];
  criteriaSummary: string;
  targetAction: "accepted" | "rejected" | "waitlisted";
  actionLabel: string;
  currentCounts: {
    pending: number;
    accepted: number;
    rejected: number;
    waitlisted: number;
  };
  projectedCounts: {
    pending: number;
    accepted: number;
    rejected: number;
    waitlisted: number;
  };
  onSuccess?: () => void;
}

type Step = 1 | 2;

export default function CriteriaConfirmDialog({
  open,
  onOpenChange,
  matchingCount,
  matchingUserIds,
  criteriaSummary,
  targetAction,
  actionLabel,
  currentCounts,
  projectedCounts,
  onSuccess,
}: CriteriaConfirmDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setStep(1);
    onOpenChange(false);
  };

  const handleContinue = () => {
    setStep(2);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      // Process in batches of 100
      const batches: string[][] = [];
      for (let i = 0; i < matchingUserIds.length; i += 100) {
        batches.push(matchingUserIds.slice(i, i + 100));
      }

      let totalSuccess = 0;
      let totalFail = 0;

      for (const batch of batches) {
        const res = await fetch("/api/bulk-update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userIds: batch,
            status: targetAction,
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          totalSuccess += data.data.successCount || 0;
          totalFail += data.data.failCount || 0;
        } else {
          totalFail += batch.length;
        }
      }

      if (totalSuccess > 0) {
        toast.success(
          `Successfully ${targetAction} ${totalSuccess} application(s).${totalFail > 0 ? ` ${totalFail} failed.` : ""}`
        );
        router.refresh();
        onSuccess?.();
      } else {
        toast.error("Failed to update applications.");
      }

      handleClose();
    } catch (error) {
      console.error("Failed to bulk update:", error);
      toast.error("An error occurred while updating applications.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionColor = () => {
    switch (targetAction) {
      case "accepted":
        return "text-green-600 dark:text-green-400";
      case "rejected":
        return "text-red-600 dark:text-red-400";
      case "waitlisted":
        return "text-yellow-600 dark:text-yellow-400";
    }
  };

  const getButtonVariant = () => {
    switch (targetAction) {
      case "rejected":
        return "destructive" as const;
      default:
        return "default" as const;
    }
  };

  const getButtonClass = () => {
    switch (targetAction) {
      case "accepted":
        return "bg-green-600 hover:bg-green-700";
      case "waitlisted":
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      default:
        return "";
    }
  };

  const getDeltaDisplay = (current: number, projected: number) => {
    const delta = projected - current;
    if (delta === 0) return null;
    return (
      <span
        className={cn(
          "text-xs font-medium",
          delta > 0 ? "text-green-600" : "text-red-600"
        )}
      >
        ({delta > 0 ? "+" : ""}
        {delta})
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-yellow-500" />
                Confirm Bulk Action
              </DialogTitle>
              <DialogDescription>
                Review the details of this action before proceeding.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-lg">
                  You are about to{" "}
                  <span className={cn("font-bold", getActionColor())}>
                    {actionLabel.toLowerCase()}
                  </span>{" "}
                  <span className="font-bold">{matchingCount}</span>{" "}
                  application{matchingCount !== 1 ? "s" : ""}.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Criteria applied:</p>
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {criteriaSummary}
                </p>
              </div>

              {(targetAction === "accepted" || targetAction === "rejected") && (
                <div className="flex items-center gap-2 rounded-md bg-yellow-100 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                  <AlertTriangle className="size-4 flex-shrink-0" />
                  <span>
                    This action will send{" "}
                    {targetAction === "accepted" ? "acceptance" : "rejection"}{" "}
                    emails to all affected applicants.
                  </span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleContinue}>
                Continue
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-blue-500" />
                Review Impact
              </DialogTitle>
              <DialogDescription>
                Review the projected changes before confirming.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-center font-semibold">
                        Current
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        After
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Pending</TableCell>
                      <TableCell className="text-center">
                        {currentCounts.pending}
                      </TableCell>
                      <TableCell className="text-center">
                        {projectedCounts.pending}{" "}
                        {getDeltaDisplay(
                          currentCounts.pending,
                          projectedCounts.pending
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-green-600 dark:text-green-400">
                        Accepted
                      </TableCell>
                      <TableCell className="text-center">
                        {currentCounts.accepted}
                      </TableCell>
                      <TableCell className="text-center">
                        {projectedCounts.accepted}{" "}
                        {getDeltaDisplay(
                          currentCounts.accepted,
                          projectedCounts.accepted
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-red-600 dark:text-red-400">
                        Rejected
                      </TableCell>
                      <TableCell className="text-center">
                        {currentCounts.rejected}
                      </TableCell>
                      <TableCell className="text-center">
                        {projectedCounts.rejected}{" "}
                        {getDeltaDisplay(
                          currentCounts.rejected,
                          projectedCounts.rejected
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-yellow-600 dark:text-yellow-400">
                        Waitlisted
                      </TableCell>
                      <TableCell className="text-center">
                        {currentCounts.waitlisted}
                      </TableCell>
                      <TableCell className="text-center">
                        {projectedCounts.waitlisted}{" "}
                        {getDeltaDisplay(
                          currentCounts.waitlisted,
                          projectedCounts.waitlisted
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-2 rounded-md border-2 border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
                <AlertTriangle className="size-4 flex-shrink-0" />
                <span className="font-medium">
                  This action cannot be undone.{" "}
                  {(targetAction === "accepted" || targetAction === "rejected") &&
                    "Emails will be sent immediately."}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant={getButtonVariant()}
                className={getButtonClass()}
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm {actionLabel} ({matchingCount})
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
