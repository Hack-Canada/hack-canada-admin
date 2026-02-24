"use client";

import { useState, useTransition } from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { getDownloadableFile } from "@/acceptance-scripts/actions/download-file";
import { saveAs } from "file-saver";

type Props = {
  entity: "users" | "applications";
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "pending", label: "Pending" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "cancelled", label: "Cancelled" },
];

const DownloadOptions = ({ entity }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState("all");

  const handleDownload = (fileType: "csv" | "json") => {
    startTransition(async () => {
      try {
        const data = await getDownloadableFile(entity, filter);
        if (!data || !Array.isArray(data) || data.length === 0) {
          toast.error(`No ${entity} data available to download.`);
          return;
        }
        if (fileType === "csv") {
          const csvData = convertArrayToCSV(data);
          const blob = new Blob([csvData], { type: "text/csv" });
          const filename =
            filter !== "all"
              ? `${entity}-${filter}.csv`
              : `${entity}data.csv`;
          saveAs(blob, filename);
        } else if (fileType === "json") {
          const jsonData = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonData], {
            type: "application/json;charset=utf-8;",
          });
          const filename =
            filter !== "all"
              ? `${entity}-${filter}.json`
              : `${entity}data.json`;
          saveAs(blob, filename);
        }
      } catch (error) {
        toast.error("Something went wrong. Failed to download file.");
      }
    });
  };

  return (
    <div className="h-fit w-fit rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md max-md:w-full">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          Download Options
        </h3>
        <p className="text-sm text-muted-foreground">
          Export {entity} data. Optionally filter by status before downloading.
        </p>
      </div>

      <div className="mt-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          disabled={isPending}
          variant="outline"
          className="flex-1 bg-background transition-all duration-200 hover:bg-muted"
          onClick={() => handleDownload("csv")}
        >
          Download CSV
        </Button>
        <Button
          disabled={isPending}
          className="flex-1 transition-all duration-200"
          onClick={() => handleDownload("json")}
        >
          Download JSON
        </Button>
      </div>
    </div>
  );
};
export default DownloadOptions;

const convertArrayToCSV = (userList: any[]) => {
  if (!userList.length) return "";

  const keys = Object.keys(userList[0]);

  const csv = [
    keys.join(","),
    ...userList.map((row: any) =>
      keys
        .map((key: any) => {
          const value =
            row[key] !== null && row[key] !== undefined
              ? row[key].toString()
              : "";
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");

  return csv;
};
