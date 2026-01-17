"use client";

import { useState } from "react";
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
