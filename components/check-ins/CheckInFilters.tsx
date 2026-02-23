"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import { useState } from "react";

type Props = {
  events: string[];
};

const CheckInFilters = ({ events }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState(searchParams.get("name") ?? "");

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/check-ins?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilter("name", name);
  };

  const clearFilters = () => {
    setName("");
    router.push("/check-ins");
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Search by name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="min-w-[200px]"
        />
        <Button size="icon" variant="outline" onClick={handleSearch}>
          <Search className="size-4" />
        </Button>
      </div>

      {events.length > 0 && (
        <Select
          value={searchParams.get("event") ?? "all"}
          onValueChange={(v) => updateFilter("event", v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map((event) => (
              <SelectItem key={event} value={event}>
                {event}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {(searchParams.get("name") || searchParams.get("event")) && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 size-4" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default CheckInFilters;
