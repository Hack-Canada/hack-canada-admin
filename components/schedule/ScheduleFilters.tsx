"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const EVENT_TYPES = ["general", "meals", "ceremonies", "workshops", "fun"];
const DAYS = ["friday", "saturday", "sunday"];

export default function ScheduleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/schedule?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilter("search", search);
  };

  const clearFilters = () => {
    setSearch("");
    router.push("/schedule");
  };

  const hasFilters =
    searchParams.get("search") ||
    searchParams.get("day") ||
    searchParams.get("type");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="min-w-[200px]"
        />
        <Button size="icon" variant="outline" onClick={handleSearch}>
          <Search className="size-4" />
        </Button>
      </div>

      <Select
        value={searchParams.get("day") ?? "all"}
        onValueChange={(v) => updateFilter("day", v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Days</SelectItem>
          {DAYS.map((day) => (
            <SelectItem key={day} value={day}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("type") ?? "all"}
        onValueChange={(v) => updateFilter("type", v)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Event Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {EVENT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
