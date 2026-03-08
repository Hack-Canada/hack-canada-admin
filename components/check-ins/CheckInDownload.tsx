"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { getDownloadableCheckIns } from "@/acceptance-scripts/actions/download-file";

interface CheckInDownloadProps {
  filters: {
    name?: string;
    eventName?: string;
  };
}

export default function CheckInDownload({ filters }: CheckInDownloadProps) {
  const [isPending, startTransition] = useTransition();
  const [downloadType, setDownloadType] = useState<"csv" | "json" | null>(null);

  const handleDownload = (type: "csv" | "json") => {
    setDownloadType(type);
    startTransition(async () => {
      try {
        const data = await getDownloadableCheckIns(filters);

        if ("error" in data) {
          toast.error(data.error);
          return;
        }

        if (!Array.isArray(data) || data.length === 0) {
          toast.error("No data to download");
          return;
        }

        const filterSuffix = filters.eventName && filters.eventName !== "all" 
          ? `_${filters.eventName.replace(/\s+/g, "-")}` 
          : "";
        const timestamp = new Date().toISOString().split("T")[0];

        if (type === "json") {
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          });
          saveAs(blob, `check-ins${filterSuffix}_${timestamp}.json`);
          toast.success(`Downloaded ${data.length} check-ins as JSON`);
        } else {
          const headers = [
            "ID",
            "Event Name",
            "Checked In At",
            "User ID",
            "User Name",
            "User Email",
            "User Role",
          ];

          const rows = data.map((row) => [
            row.id,
            row.eventName,
            row.checkedInAt ? new Date(row.checkedInAt).toISOString() : "",
            row.userId,
            row.userName,
            row.userEmail,
            row.userRole,
          ]);

          const csvContent = [
            headers.join(","),
            ...rows.map((row) =>
              row
                .map((cell) => {
                  const str = String(cell ?? "");
                  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                    return `"${str.replace(/"/g, '""')}"`;
                  }
                  return str;
                })
                .join(","),
            ),
          ].join("\n");

          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
          saveAs(blob, `check-ins${filterSuffix}_${timestamp}.csv`);
          toast.success(`Downloaded ${data.length} check-ins as CSV`);
        }
      } catch (error) {
        toast.error("Failed to download data");
        console.error("Download error:", error);
      } finally {
        setDownloadType(null);
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDownload("csv")}
        disabled={isPending}
      >
        {isPending && downloadType === "csv" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDownload("json")}
        disabled={isPending}
      >
        {isPending && downloadType === "json" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        JSON
      </Button>
    </div>
  );
}
