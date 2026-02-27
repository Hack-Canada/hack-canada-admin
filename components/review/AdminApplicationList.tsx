"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import SortApplications from "./SortApplications";
import ApplicationStatusModal from "@/components/ApplicationStatusModal";
import { ApplicationStatusModalTrigger } from "@/components/search/ApplicationStatusModalTrigger";
import BulkActions from "./BulkActions";
import Link from "next/link";
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  reviewCount: number | null;
  averageRating: number | null;
  normalizedAvgRating: number | null;
  internalResult: string | null;
  userId: string;
  confidence: number;
  lastNormalizedAt: Date | null;
}

interface AdminApplicationListProps {
  applications: Application[];
  lastNormalizedAt: Date | null;
}

const getReviewCountColor = (count: number | null) => {
  if (count === null) return "text-gray-500";
  if (count <= 1) return "text-red-500 font-medium";
  if (count <= 3) return "text-yellow-500 font-medium";
  return "text-green-500 font-medium";
};

const getRatingColor = (rating: number | null) => {
  if (rating === null) return "text-gray-500";
  const normalizedRating = rating / 100;
  if (normalizedRating <= 3) return "text-red-500 font-medium";
  if (normalizedRating <= 6) return "text-yellow-500 font-medium";
  return "text-green-500 font-medium";
};

const getConfidenceColor = (confidence: number) => {
  if (confidence < 40) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
  if (confidence < 70) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400";
  return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
};

type SortField =
  | "reviewCount"
  | "averageRating"
  | "normalizedAvgRating"
  | "confidence"
  | "internalResult";
type SortOrder = "asc" | "desc";

export default function AdminApplicationList({
  applications,
  lastNormalizedAt,
}: AdminApplicationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isNormalizing, startNormalization] = useTransition();

  const currentSort = {
    field: (searchParams.get("sort") as SortField) ?? "reviewCount",
    order: (searchParams.get("order") as SortOrder) ?? "desc",
  };

  const handleSort = (field: SortField, order: SortOrder) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", field);
    params.set("order", order);
    router.push(`?${params.toString()}`);
  };

  const handleNormalize = () => {
    startNormalization(async () => {
      try {
        const res = await fetch("/api/normalize-ratings", {
          method: "POST",
        });
        const data = await res.json();

        if (data.success) {
          toast.success(data.message);
          router.refresh();
        } else {
          toast.error(data.message || "Failed to normalize ratings");
        }
      } catch {
        toast.error("Failed to normalize ratings");
      }
    });
  };

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map((a) => a.userId));
    }
  };

  if (!applications.length) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Normalization Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleNormalize}
            disabled={isNormalizing}
            variant="default"
            size="sm"
          >
            {isNormalizing ? (
              <RefreshCw className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Normalize Ratings
          </Button>
          {lastNormalizedAt ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-green-500" />
              Last normalized: {formatDate(lastNormalizedAt)}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="size-4" />
              Ratings have not been normalized yet
            </div>
          )}
        </div>
        <SortApplications onSort={handleSort} currentSort={currentSort} />
      </div>

      <BulkActions
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
      />

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 transition-colors hover:bg-muted">
                <TableHead className="w-[40px] py-4">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === applications.length &&
                      applications.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="size-4 cursor-pointer rounded border-border"
                  />
                </TableHead>
                <TableHead className="py-4 font-semibold">Name</TableHead>
                <TableHead className="py-4 font-semibold">Status</TableHead>
                <TableHead className="py-4 text-center font-semibold">
                  Reviews
                </TableHead>
                <TableHead className="py-4 text-center font-semibold">
                  Raw Avg
                </TableHead>
                <TableHead className="py-4 text-center font-semibold">
                  Normalized
                </TableHead>
                <TableHead className="py-4 text-center font-semibold">
                  Confidence
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow
                  key={application.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <TableCell className="py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(application.userId)}
                      onChange={() => toggleSelect(application.userId)}
                      className="size-4 cursor-pointer rounded border-border"
                    />
                  </TableCell>
                  <TableCell className="py-4 font-medium">
                    <Link
                      className="group relative flex w-fit items-center gap-1.5"
                      href={`/applications/${application.userId}`}
                    >
                      {application.firstName} {application.lastName}
                      <ExternalLink size={16} />
                      <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-foreground transition-transform group-hover:scale-x-100"></span>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {application.email}
                    </p>
                  </TableCell>
                  <TableCell className="py-4">
                    <ApplicationStatusModal
                      userId={application.userId}
                      name={`${application.firstName} ${application.lastName}`}
                      email={application.email ?? ""}
                      status={application.internalResult as ApplicationStatus}
                    >
                      <ApplicationStatusModalTrigger
                        status={application.internalResult as ApplicationStatus}
                      />
                    </ApplicationStatusModal>
                  </TableCell>
                  <TableCell
                    className={`py-4 text-center ${getReviewCountColor(application.reviewCount)}`}
                  >
                    {application.reviewCount ?? 0}
                  </TableCell>
                  <TableCell
                    className={`py-4 text-center ${getRatingColor(application.averageRating)}`}
                  >
                    {application.averageRating
                      ? (application.averageRating / 100).toFixed(1)
                      : "N/A"}
                  </TableCell>
                  <TableCell
                    className={`py-4 text-center ${getRatingColor(application.normalizedAvgRating)}`}
                  >
                    {application.normalizedAvgRating
                      ? (application.normalizedAvgRating / 100).toFixed(1)
                      : "—"}
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <span
                      className={cn(
                        "inline-flex min-w-[3.5rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
                        getConfidenceColor(application.confidence)
                      )}
                    >
                      {application.confidence}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
