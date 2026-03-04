"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getDownloadableRsvpList } from "@/acceptance-scripts/actions/download-file";
import { saveAs } from "file-saver";
import { Download, Loader2 } from "lucide-react";

const convertArrayToCSV = (data: Record<string, unknown>[]) => {
  if (!data.length) return "";

  const keys = Object.keys(data[0]);
  return [
    keys.join(","),
    ...data.map((row) =>
      keys
        .map((key) => {
          const value =
            row[key] !== null && row[key] !== undefined
              ? String(row[key])
              : "";
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");
};

const RsvpDownload = () => {
  const [isPending, startTransition] = useTransition();
  const [format, setFormat] = useState<"csv" | "json">("csv");

  const handleDownload = (fileType: "csv" | "json") => {
    setFormat(fileType);
    startTransition(async () => {
      try {
        const data = await getDownloadableRsvpList();

        if ("error" in data) {
          toast.error("Unauthorized");
          return;
        }

        if (!Array.isArray(data) || data.length === 0) {
          toast.error("No RSVP data available to download.");
          return;
        }

        if (fileType === "csv") {
          const csv = convertArrayToCSV(data);
          const blob = new Blob([csv], { type: "text/csv" });
          saveAs(blob, "rsvp-list.csv");
        } else {
          const json = JSON.stringify(data, null, 2);
          const blob = new Blob([json], {
            type: "application/json;charset=utf-8;",
          });
          saveAs(blob, "rsvp-list.json");
        }

        toast.success(`RSVP list downloaded as ${fileType.toUpperCase()}`);
      } catch {
        toast.error("Failed to download RSVP list.");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => handleDownload("csv")}
      >
        {isPending && format === "csv" ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Download className="mr-2 size-4" />
        )}
        Download CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => handleDownload("json")}
      >
        {isPending && format === "json" ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Download className="mr-2 size-4" />
        )}
        Download JSON
      </Button>
    </div>
  );
};

export default RsvpDownload;
