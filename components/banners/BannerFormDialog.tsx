"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bannerSchema, type BannerInput } from "@/lib/validations/banner";
import type { Banner } from "@/lib/db/schema";

const BANNER_TYPES = [
  { value: "info", label: "Info", description: "Blue - General information" },
  {
    value: "warning",
    label: "Warning",
    description: "Amber - Important notice",
  },
  { value: "success", label: "Success", description: "Green - Positive news" },
  { value: "error", label: "Error", description: "Red - Critical alert" },
] as const;

function toLocalDatetimeString(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

const EMPTY_VALUES: BannerInput = {
  type: "info",
  message: "",
  linkText: "",
  linkUrl: "",
  isActive: true,
  expiresAt: null,
};

function bannerToFormValues(banner: Banner): BannerInput {
  return {
    type: banner.type as BannerInput["type"],
    message: banner.message,
    linkText: banner.linkText ?? "",
    linkUrl: banner.linkUrl ?? "",
    isActive: banner.isActive,
    expiresAt: banner.expiresAt ? new Date(banner.expiresAt) : null,
  };
}

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: Banner;
}

export default function BannerFormDialog({
  open,
  onOpenChange,
  banner,
}: BannerFormDialogProps) {
  const router = useRouter();
  const isEditing = !!banner;

  const form = useForm<BannerInput>({
    resolver: zodResolver(bannerSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    if (banner) {
      form.reset(bannerToFormValues(banner));
    } else {
      form.reset(EMPTY_VALUES);
    }
  }, [open, banner, form]);

  async function onSubmit(values: BannerInput) {
    try {
      const url = isEditing ? `/api/banners/${banner!.id}` : "/api/banners";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Banner" : "Create Banner"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the banner details below."
              : "Fill in the details to create a new banner."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BANNER_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            <span className="font-medium">{t.label}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {t.description}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription className="text-xs">
                        Show this banner to users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the banner message..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="linkText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Text (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Learn more"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link URL (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires At (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={
                        field.value ? toLocalDatetimeString(field.value) : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val ? new Date(val) : null);
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Leave empty for no expiration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Banner"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
