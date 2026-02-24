"use client";

import { Button } from "@/components/ui/button";
import Container from "@/components/Container";
import { RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="max-w-md text-muted-foreground">
          An error occurred while loading this page. This may be a temporary
          issue — please try again.
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
    </Container>
  );
}
