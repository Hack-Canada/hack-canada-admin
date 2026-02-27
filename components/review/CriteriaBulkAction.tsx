"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
  CriteriaPreviewRequest,
  CriteriaPreviewResponse,
} from "@/app/api/criteria-preview/route";
import CriteriaConfirmDialog from "./CriteriaConfirmDialog";

interface CriteriaBulkActionProps {
  statusCounts: {
    pending: number;
    accepted: number;
    rejected: number;
    waitlisted: number;
  };
  onSuccess?: () => void;
}

type TargetAction = "accepted" | "rejected" | "waitlisted";

export default function CriteriaBulkAction({
  statusCounts,
  onSuccess,
}: CriteriaBulkActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Filter state
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10]);
  const [confidenceRange, setConfidenceRange] = useState<[number, number]>([
    0, 100,
  ]);
  const [minReviewCount, setMinReviewCount] = useState(3);
  const [selectedStatuses, setSelectedStatuses] = useState<
    ("pending" | "waitlisted")[]
  >(["pending"]);
  const [targetAction, setTargetAction] = useState<TargetAction>("accepted");

  // Preview state
  const [previewData, setPreviewData] =
    useState<CriteriaPreviewResponse | null>(null);

  const fetchPreview = useCallback(async () => {
    if (selectedStatuses.length === 0) {
      setPreviewData(null);
      return;
    }

    setIsLoading(true);
    try {
      const payload: CriteriaPreviewRequest = {
        minRating: ratingRange[0],
        maxRating: ratingRange[1],
        minConfidence: confidenceRange[0],
        maxConfidence: confidenceRange[1],
        minReviewCount,
        currentStatuses: selectedStatuses,
        targetAction,
      };

      const res = await fetch("/api/criteria-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPreviewData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch preview:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    ratingRange,
    confidenceRange,
    minReviewCount,
    selectedStatuses,
    targetAction,
  ]);

  // Debounced preview fetch
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      fetchPreview();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isOpen, fetchPreview]);

  const handleStatusToggle = (status: "pending" | "waitlisted") => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const getCriteriaSummary = () => {
    const parts: string[] = [];
    parts.push(`Normalized rating ${ratingRange[0].toFixed(1)}-${ratingRange[1].toFixed(1)}`);
    parts.push(`Confidence ${confidenceRange[0]}%-${confidenceRange[1]}%`);
    parts.push(`Min ${minReviewCount} reviews`);
    parts.push(`Status: ${selectedStatuses.join(", ")}`);
    return parts.join(", ");
  };

  const getActionLabel = (action: TargetAction) => {
    switch (action) {
      case "accepted":
        return "Accept";
      case "rejected":
        return "Reject";
      case "waitlisted":
        return "Waitlist";
    }
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Bulk Decision by Criteria</span>
                {isOpen ? (
                  <ChevronUp className="size-5" />
                ) : (
                  <ChevronDown className="size-5" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {/* Filter Controls */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Normalized Rating Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Normalized Rating Range
                  </Label>
                  <div className="space-y-2">
                    <Slider
                      value={ratingRange}
                      onValueChange={(value) =>
                        setRatingRange(value as [number, number])
                      }
                      min={0}
                      max={10}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{ratingRange[0].toFixed(1)}</span>
                      <span>{ratingRange[1].toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Confidence Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Confidence Range (%)
                  </Label>
                  <div className="space-y-2">
                    <Slider
                      value={confidenceRange}
                      onValueChange={(value) =>
                        setConfidenceRange(value as [number, number])
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{confidenceRange[0]}%</span>
                      <span>{confidenceRange[1]}%</span>
                    </div>
                  </div>
                </div>

                {/* Min Review Count */}
                <div className="space-y-3">
                  <Label htmlFor="minReviewCount" className="text-sm font-medium">
                    Minimum Review Count
                  </Label>
                  <Input
                    id="minReviewCount"
                    type="number"
                    min={0}
                    max={20}
                    value={minReviewCount}
                    onChange={(e) =>
                      setMinReviewCount(parseInt(e.target.value) || 0)
                    }
                    className="w-full"
                  />
                </div>

                {/* Current Status Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Current Status (eligible for change)
                  </Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="status-pending"
                        checked={selectedStatuses.includes("pending")}
                        onCheckedChange={() => handleStatusToggle("pending")}
                      />
                      <Label
                        htmlFor="status-pending"
                        className="cursor-pointer text-sm"
                      >
                        Pending ({statusCounts.pending})
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="status-waitlisted"
                        checked={selectedStatuses.includes("waitlisted")}
                        onCheckedChange={() => handleStatusToggle("waitlisted")}
                      />
                      <Label
                        htmlFor="status-waitlisted"
                        className="cursor-pointer text-sm"
                      >
                        Waitlisted ({statusCounts.waitlisted})
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Selector */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Target Action</Label>
                <Select
                  value={targetAction}
                  onValueChange={(v) => setTargetAction(v as TargetAction)}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accepted">Accept</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                    <SelectItem value="waitlisted">Waitlist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Live Preview Section */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="size-4" />
                  <span className="font-medium">Preview</span>
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                </div>

                {selectedStatuses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Please select at least one status to filter by.
                  </p>
                ) : previewData ? (
                  <div className="space-y-3">
                    <p className="text-lg font-semibold">
                      {previewData.matchingCount} applications match your
                      criteria
                    </p>

                    {previewData.matchingCount > 100 && (
                      <div className="flex items-center gap-2 rounded-md bg-yellow-100 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                        <AlertTriangle className="size-4 flex-shrink-0" />
                        <span>
                          More than 100 applications match. The API processes up
                          to 100 at a time. Consider narrowing your criteria.
                        </span>
                      </div>
                    )}

                    {previewData.preview.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Sample matches:
                        </p>
                        <ul className="space-y-1 text-sm">
                          {previewData.preview.map((app, i) => (
                            <li key={i} className="text-muted-foreground">
                              {app.firstName} {app.lastName} ({app.email})
                            </li>
                          ))}
                          {previewData.matchingCount > 5 && (
                            <li className="text-muted-foreground">
                              ...and {previewData.matchingCount - 5} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Loading preview...
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={
                    !previewData ||
                    previewData.matchingCount === 0 ||
                    selectedStatuses.length === 0
                  }
                  className={cn(
                    targetAction === "rejected" && "bg-red-600 hover:bg-red-700",
                    targetAction === "accepted" &&
                      "bg-green-600 hover:bg-green-700",
                    targetAction === "waitlisted" &&
                      "bg-yellow-600 hover:bg-yellow-700"
                  )}
                >
                  Review Selection ({previewData?.matchingCount ?? 0}{" "}
                  applications)
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Confirmation Dialog */}
      {previewData && (
        <CriteriaConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          matchingCount={previewData.matchingCount}
          matchingUserIds={previewData.matchingUserIds}
          criteriaSummary={getCriteriaSummary()}
          targetAction={targetAction}
          actionLabel={getActionLabel(targetAction)}
          currentCounts={previewData.currentCounts}
          projectedCounts={previewData.projectedCounts}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}
