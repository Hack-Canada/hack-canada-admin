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

const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const RsvpFilters = () => {
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
    router.push(`/rsvps?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilter("name", name);
  };

  const clearFilters = () => {
    setName("");
    router.push("/rsvps");
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

      <Select
        value={searchParams.get("tshirt") ?? "all"}
        onValueChange={(v) => updateFilter("tshirt", v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="T-Shirt Size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sizes</SelectItem>
          {TSHIRT_SIZES.map((size) => (
            <SelectItem key={size} value={size}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(searchParams.get("name") ||
        searchParams.get("tshirt") ||
        searchParams.get("diet")) && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 size-4" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default RsvpFilters;
