"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Challenge } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { ChevronDownIcon } from "lucide-react";

import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  points: z.preprocess((val) => Number(val), z.number().min(0)),
  difficulty: z.enum(["easy", "medium", "hard"]),
  shortDescription: z.string().min(1, "Short description is required"),
  instructions: z.string().min(1, "Instructions are required"),
  hints: z.string().optional(), // We'll parse this to string[]
  qrCode: z.boolean().default(false),
  submissionInstructions: z
    .string()
    .min(1, "Submission instructions are required"),
  maxCompletions: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional(),
  ),
  enabled: z.boolean().default(true),
  deadlineStart: z.coerce.date().optional(),
  deadlineEnd: z.coerce.date().optional(),
  showTime: z.coerce.date().optional(),
});

interface ChallengeFormProps {
  challenge?: Challenge;
  defaultOpen?: boolean; // For auto-opening if needed, though we use Dialog in parent
  onSuccess?: () => void;
}

export function ChallengeForm({ challenge, onSuccess }: ChallengeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: (challenge
      ? {
          ...challenge,
          hints: challenge.hints.join("\n"),
          maxCompletions: challenge.maxCompletions,
          difficulty: challenge.difficulty as "easy" | "medium" | "hard",
        }
      : {
          name: "",
          category: "",
          points: 0,
          difficulty: "easy",
          shortDescription: "",
          instructions: "",
          hints: "",
          qrCode: false,
          submissionInstructions: "",
          maxCompletions: null,
          enabled: true,
          deadlineStart: null,
          deadlineEnd: null,
          showTime: null,
        }) as any,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const hintsArray = values.hints
        ? values.hints.split("\n").filter((h) => h.trim() !== "")
        : [];

      // We need to cast difficulty and status here because the form schema uses string literals
      // that match the API expectation, but Zod inference might be tricky with the form default values.
      // Ideally, we align the form schema with the API schema completely, but for the textarea/array mismatch
      // we handle it here.
      const payload = {
        ...values,
        hints: hintsArray,
      };

      const url = challenge
        ? `/api/challenges/${challenge.id}`
        : "/api/challenges";
      const method = challenge ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        toast.error(data.message || "Something went wrong");
        return;
      }

      toast.success(challenge ? "Challenge updated" : "Challenge created");

      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Challenge Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Category" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="points"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxCompletions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Completions (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <Input placeholder="Brief description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions (Markdown)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed instructions..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="submissionInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Submission Instructions</FormLabel>
              <FormControl>
                <Textarea placeholder="How to submit..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hints (One per line)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Hint 1&#10;Hint 2"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deadlineStart"
          render={({ field }) => {
            const initialTime = field.value
              ? `${field.value.getHours().toString().padStart(2, "0")}:${field.value
                  .getMinutes()
                  .toString()
                  .padStart(2, "0")}:${field.value
                  .getSeconds()
                  .toString()
                  .padStart(2, "0")}`
              : undefined;

            const [open, setOpen] = useState(false);
            const [date, setDate] = useState<Date | undefined>(field.value);
            const [timeString, setTimeString] = useState<string>(
              initialTime ?? "",
            );

            // Keep local state in sync with RHF field if it changes externally
            useEffect(() => {
              if (field.value) {
                const d = new Date(field.value);

                // Only update if date changed
                if (!date || d.getTime() !== date.getTime()) {
                  setDate(d);
                }

                const t = `${d.getHours().toString().padStart(2, "0")}:${d
                  .getMinutes()
                  .toString()
                  .padStart(
                    2,
                    "0",
                  )}:${d.getSeconds().toString().padStart(2, "0")}`;

                if (t !== timeString) {
                  setTimeString(t);
                }
              } else {
                if (date !== undefined) setDate(undefined);
                if (timeString !== undefined) setTimeString("");
              }
            }, [field.value]);

            // Update RHF field whenever date or time changes
            useEffect(() => {
              if (!date && !timeString) {
                field.onChange(undefined);
                return;
              }

              const combinedDate = date ?? new Date();
              if (timeString) {
                const [h, m, s] = timeString.split(":").map(Number);
                combinedDate.setHours(h, m, s);
              }

              field.onChange(combinedDate);
            }, [date, timeString]);

            return (
              <div className="grid grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Start of submission window</FormLabel>
                  <FormControl>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date-picker-optional"
                          className="w-full justify-between font-normal"
                        >
                          {date ? format(date, "PPP") : "Select date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={date}
                          captionLayout="dropdown"
                          defaultMonth={date}
                          onSelect={(date) => {
                            setDate(date);
                            setOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      id="time-picker-optional"
                      step="1"
                      value={timeString}
                      onChange={(e) => setTimeString(e.target.value)}
                      className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  </FormControl>
                </FormItem>
              </div>
            );
          }}
        />

        <FormField
          control={form.control}
          name="deadlineEnd"
          render={({ field }) => {
            const initialTime = field.value
              ? `${field.value.getHours().toString().padStart(2, "0")}:${field.value
                  .getMinutes()
                  .toString()
                  .padStart(2, "0")}:${field.value
                  .getSeconds()
                  .toString()
                  .padStart(2, "0")}`
              : undefined;

            const [open, setOpen] = useState(false);
            const [date, setDate] = useState<Date | undefined>(field.value);
            const [timeString, setTimeString] = useState<string>(
              initialTime ?? "",
            );

            // Keep local state in sync with RHF field if it changes externally
            useEffect(() => {
              if (field.value) {
                const d = new Date(field.value);

                // Only update if date changed
                if (!date || d.getTime() !== date.getTime()) {
                  setDate(d);
                }

                const t = `${d.getHours().toString().padStart(2, "0")}:${d
                  .getMinutes()
                  .toString()
                  .padStart(
                    2,
                    "0",
                  )}:${d.getSeconds().toString().padStart(2, "0")}`;

                if (t !== timeString) {
                  setTimeString(t);
                }
              } else {
                if (date !== undefined) setDate(undefined);
                if (timeString !== undefined) setTimeString("");
              }
            }, [field.value]);

            // Update RHF field whenever date or time changes
            useEffect(() => {
              if (!date && !timeString) {
                field.onChange(undefined);
                return;
              }

              const combinedDate = date ?? new Date();
              if (timeString) {
                const [h, m, s] = timeString.split(":").map(Number);
                combinedDate.setHours(h, m, s);
              }

              field.onChange(combinedDate);
            }, [date, timeString]);

            return (
              <div className="grid grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>End of submission window</FormLabel>
                  <FormControl>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date-picker-optional"
                          className="w-full justify-between font-normal"
                        >
                          {date ? format(date, "PPP") : "Select date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={date}
                          captionLayout="dropdown"
                          defaultMonth={date}
                          onSelect={(date) => {
                            setDate(date);
                            setOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      id="time-picker-optional"
                      step="1"
                      value={timeString}
                      onChange={(e) => setTimeString(e.target.value)}
                      className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  </FormControl>
                </FormItem>
              </div>
            );
          }}
        />

        <FormField
          control={form.control}
          name="showTime"
          render={({ field }) => {
            const initialTime = field.value
              ? `${field.value.getHours().toString().padStart(2, "0")}:${field.value
                  .getMinutes()
                  .toString()
                  .padStart(2, "0")}:${field.value
                  .getSeconds()
                  .toString()
                  .padStart(2, "0")}`
              : undefined;

            const [open, setOpen] = useState(false);
            const [date, setDate] = useState<Date | undefined>(field.value);
            const [timeString, setTimeString] = useState<string>(
              initialTime ?? "",
            );

            // Keep local state in sync with RHF field if it changes externally
            useEffect(() => {
              if (field.value) {
                const d = new Date(field.value);

                // Only update if date changed
                if (!date || d.getTime() !== date.getTime()) {
                  setDate(d);
                }

                const t = `${d.getHours().toString().padStart(2, "0")}:${d
                  .getMinutes()
                  .toString()
                  .padStart(
                    2,
                    "0",
                  )}:${d.getSeconds().toString().padStart(2, "0")}`;

                if (t !== timeString) {
                  setTimeString(t);
                }
              } else {
                if (date !== undefined) setDate(undefined);
                if (timeString !== undefined) setTimeString("");
              }
            }, [field.value]);

            // Update RHF field whenever date or time changes
            useEffect(() => {
              if (!date && !timeString) {
                field.onChange(undefined);
                return;
              }

              const combinedDate = date ?? new Date();
              if (timeString) {
                const [h, m, s] = timeString.split(":").map(Number);
                combinedDate.setHours(h, m, s);
              }

              field.onChange(combinedDate);
            }, [date, timeString]);

            return (
              <div className="grid grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>
                    Time this challenge becomes viewable to participants
                  </FormLabel>
                  <FormControl>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date-picker-optional"
                          className="w-full justify-between font-normal"
                        >
                          {date ? format(date, "PPP") : "Select date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={date}
                          captionLayout="dropdown"
                          defaultMonth={date}
                          onSelect={(date) => {
                            setDate(date);
                            setOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      id="time-picker-optional"
                      step="1"
                      value={timeString}
                      onChange={(e) => setTimeString(e.target.value)}
                      className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  </FormControl>
                </FormItem>
              </div>
            );
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="qrCode"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">QR Code Challenge</FormLabel>
                  <FormDescription>
                    Is this a QR code scan challenge?
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
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enabled</FormLabel>
                  <FormDescription>Is this challenge visible?</FormDescription>
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

        <Button type="submit" disabled={loading} className="w-full">
          {loading
            ? "Saving..."
            : challenge
              ? "Update Challenge"
              : "Create Challenge"}
        </Button>
      </form>
    </Form>
  );
}
