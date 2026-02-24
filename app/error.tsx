"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="max-w-md text-muted-foreground">
          An unexpected error occurred. Please try again or return to the
          dashboard.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RefreshCw className="mr-2 size-4" />
          Try Again
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 size-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
