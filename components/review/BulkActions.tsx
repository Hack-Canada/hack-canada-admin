"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Props = {
  selectedIds: string[];
  onClear: () => void;
};

const BulkActions = ({ selectedIds, onClear }: Props) => {
  const [status, setStatus] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (selectedIds.length === 0) return null;

  const handleBulkUpdate = () => {
    if (!status) {
      toast.error("Please select a status.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/bulk-update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: selectedIds, status }),
        });

        const data = await res.json();

        if (data.success) {
          toast.success(data.message);
          onClear();
          router.refresh();
        } else {
          toast.error(data.message);
        }
      } catch {
        toast.error("Failed to perform bulk update.");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
      <span className="text-sm font-medium">
        {selectedIds.length} selected
      </span>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Set status..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="accepted">Accept</SelectItem>
          <SelectItem value="rejected">Reject</SelectItem>
          <SelectItem value="waitlisted">Waitlist</SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={handleBulkUpdate}
        disabled={isPending || !status}
        size="sm"
      >
        {isPending ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : null}
        Apply
      </Button>

      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
};

export default BulkActions;
