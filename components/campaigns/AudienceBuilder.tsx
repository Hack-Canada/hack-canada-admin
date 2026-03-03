"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AUDIENCE_PRESETS,
  type AudienceFilterInput,
} from "@/lib/validations/campaign";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Loader2,
} from "lucide-react";

type RecipientPreview = {
  id: string;
  name: string;
  email: string;
  applicationStatus: string;
  rsvpAt: Date | null;
  role: string;
};

type PreviewResult = {
  count: number;
  recipients: RecipientPreview[];
  hasMore: boolean;
};

type Props = {
  value: AudienceFilterInput;
  onChange: (filter: AudienceFilterInput) => void;
  disabled?: boolean;
};

const APPLICATION_STATUSES = [
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "pending", label: "Pending" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "cancelled", label: "Cancelled" },
  { value: "not_applied", label: "Not Applied" },
];

const LEVELS_OF_STUDY = [
  "Undergraduate",
  "Graduate",
  "High School",
  "Bootcamp",
  "Other",
];

export function AudienceBuilder({ value, onChange, disabled }: Props) {
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const fetchPreview = useCallback(async (filter: AudienceFilterInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/campaigns/recipients-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filter),
      });

      const data = await response.json();
      if (data.success) {
        setPreview(data.data);
      }
    } catch (error) {
      console.error("Error fetching preview:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const hasAnyFilter =
      (value.applicationStatus && value.applicationStatus.length > 0) ||
      value.hasRsvp ||
      value.school ||
      value.levelOfStudy ||
      (value.roles && value.roles.length > 0) ||
      value.searchQuery;

    if (hasAnyFilter) {
      const timer = setTimeout(() => {
        fetchPreview(value);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPreview(null);
    }
  }, [value, fetchPreview]);

  const handlePresetClick = (presetId: string) => {
    const preset = AUDIENCE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      onChange({
        preset: presetId,
        ...preset.filter,
        searchQuery: value.searchQuery,
      });
    }
  };

  const handleStatusToggle = (status: string) => {
    const currentStatuses = value.applicationStatus || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    setSelectedPreset(null);
    onChange({
      ...value,
      applicationStatus: newStatuses.length > 0 ? newStatuses : undefined,
      preset: undefined,
    });
  };

  const handleRsvpChange = (rsvp: "yes" | "no" | "any") => {
    setSelectedPreset(null);
    onChange({
      ...value,
      hasRsvp: rsvp === "any" ? undefined : rsvp,
      preset: undefined,
    });
  };

  const handleSearchChange = (searchQuery: string) => {
    onChange({
      ...value,
      searchQuery: searchQuery || undefined,
    });
  };

  const clearFilters = () => {
    setSelectedPreset(null);
    onChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Audience Builder
        </CardTitle>
        <CardDescription>
          Select recipients using presets or build a custom audience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant={selectedPreset === preset.id ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(preset.id)}
                disabled={disabled}
              >
                {preset.name}
              </Button>
            ))}
            {(selectedPreset ||
              (value.applicationStatus &&
                value.applicationStatus.length > 0)) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={disabled}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={value.searchQuery || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            disabled={disabled}
          />
        </div>

        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Advanced Filters
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Application Status</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {APPLICATION_STATUSES.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={(value.applicationStatus || []).includes(
                        status.value,
                      )}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                      disabled={disabled}
                    />
                    <label
                      htmlFor={`status-${status.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {status.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">RSVP Status</Label>
              <Select
                value={value.hasRsvp || "any"}
                onValueChange={(v) =>
                  handleRsvpChange(v as "yes" | "no" | "any")
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any RSVP status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="yes">Has RSVP&apos;d</SelectItem>
                  <SelectItem value="no">Has NOT RSVP&apos;d</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-sm font-medium">School</Label>
                <Input
                  placeholder="Filter by school..."
                  value={value.school || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      school: e.target.value || undefined,
                      preset: undefined,
                    })
                  }
                  disabled={disabled}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Level of Study</Label>
                <Select
                  value={value.levelOfStudy || "any"}
                  onValueChange={(v) =>
                    onChange({
                      ...value,
                      levelOfStudy: v === "any" ? undefined : v,
                      preset: undefined,
                    })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {LEVELS_OF_STUDY.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading preview...
            </span>
          </div>
        )}

        {preview && !isLoading && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {preview.count} recipient{preview.count !== 1 ? "s" : ""} match
                </span>
              </div>
              {preview.count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                >
                  {isPreviewOpen ? "Hide" : "Show"} Preview
                  {isPreviewOpen ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {isPreviewOpen && preview.recipients.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="pb-2 text-left font-medium">Name</th>
                      <th className="pb-2 text-left font-medium">Email</th>
                      <th className="pb-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.recipients.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2">{r.name}</td>
                        <td className="py-2 text-muted-foreground">{r.email}</td>
                        <td className="py-2">
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                            {r.applicationStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.hasMore && (
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    and {preview.count - preview.recipients.length} more...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
