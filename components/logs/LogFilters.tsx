"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

type Props = {
  entityTypes: string[];
};

const LogFilters = ({ entityTypes }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/logs?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/logs");
  };

  const hasFilters =
    searchParams.get("action") ||
    searchParams.get("entityType") ||
    searchParams.get("fromDate") ||
    searchParams.get("toDate");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Action</Label>
        <Select
          value={searchParams.get("action") ?? "all"}
          onValueChange={(v) => updateFilter("action", v)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="view">View</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Entity Type</Label>
        <Select
          value={searchParams.get("entityType") ?? "all"}
          onValueChange={(v) => updateFilter("entityType", v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {entityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          type="date"
          value={searchParams.get("fromDate") ?? ""}
          onChange={(e) => updateFilter("fromDate", e.target.value)}
          className="w-[160px]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          type="date"
          value={searchParams.get("toDate") ?? ""}
          onChange={(e) => updateFilter("toDate", e.target.value)}
          className="w-[160px]"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 size-4" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default LogFilters;
