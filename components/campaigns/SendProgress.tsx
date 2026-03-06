"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  XCircle,
} from "lucide-react";

type BatchResult = {
  sent: number;
  failed: number;
  remaining: number;
  totalSent: number;
  totalFailed: number;
  isComplete: boolean;
};

type Props = {
  campaignId: string;
  totalRecipients: number;
  initialSentCount: number;
  initialFailedCount: number;
  campaignStatus?: string;
  onComplete: () => void;
};

export function SendProgress({
  campaignId,
  totalRecipients,
  initialSentCount,
  initialFailedCount,
  campaignStatus,
  onComplete,
}: Props) {
  const [sentCount, setSentCount] = useState(initialSentCount);
  const [failedCount, setFailedCount] = useState(initialFailedCount);
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(campaignStatus === "paused");
  const [isComplete, setIsComplete] = useState(campaignStatus === "completed");
  const [error, setError] = useState<string | null>(null);
  const [batchesSent, setBatchesSent] = useState(0);
  const abortRef = useRef(false);

  const hasPartialProgress = initialSentCount > 0 || initialFailedCount > 0;

  const progress = Math.round(
    ((sentCount + failedCount) / totalRecipients) * 100,
  );
  const remaining = totalRecipients - sentCount - failedCount;

  const sendBatch = useCallback(async (): Promise<BatchResult | null> => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send-batch`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send batch");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to send batch");
      }

      return data.data as BatchResult;
    } catch (err) {
      console.error("Batch error:", err);
      throw err;
    }
  }, [campaignId]);

  const startSending = useCallback(async () => {
    setIsSending(true);
    setIsPaused(false);
    setError(null);
    abortRef.current = false;

    try {
      while (!abortRef.current) {
        const result = await sendBatch();

        if (!result) break;

        setSentCount(result.totalSent);
        setFailedCount(result.totalFailed);
        setBatchesSent((prev) => prev + 1);

        if (result.isComplete) {
          setIsComplete(true);
          onComplete();
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSending(false);
    }
  }, [sendBatch, onComplete]);

  const pauseSending = () => {
    abortRef.current = true;
    setIsPaused(true);
  };

  const resumeSending = () => {
    startSending();
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSending && !isComplete) {
        e.preventDefault();
        e.returnValue =
          "Emails are still being sent. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSending, isComplete]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isComplete ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Sending Complete
            </>
          ) : isSending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending Emails...
            </>
          ) : isPaused ? (
            <>
              <Pause className="h-5 w-5 text-amber-500" />
              Sending Paused
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Ready to Send
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isComplete
            ? `Successfully sent ${sentCount} emails`
            : hasPartialProgress && !isSending
              ? `${sentCount + failedCount} of ${totalRecipients} processed, ${remaining} remaining`
              : `Sending to ${totalRecipients} recipients`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-300 ${
                isComplete
                  ? "bg-green-500"
                  : failedCount > 0
                    ? "bg-gradient-to-r from-green-500 to-amber-500"
                    : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold text-green-600">{sentCount}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold text-muted-foreground">
              {remaining}
            </p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>

        {isSending && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Do not close this tab
              </p>
            </div>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Emails are being sent in batches. Closing this tab will pause the
              sending process.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="font-medium text-red-800 dark:text-red-200">
                Error
              </p>
            </div>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        {!isComplete && (
          <div className="flex gap-2">
            {!isSending && !isPaused && (
              <Button onClick={startSending} className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                {hasPartialProgress ? "Resume Sending" : "Start Sending"}
              </Button>
            )}
            {isSending && (
              <Button
                variant="outline"
                onClick={pauseSending}
                className="flex-1"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {isPaused && (
              <Button onClick={resumeSending} className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                Resume Sending
              </Button>
            )}
          </div>
        )}

        {isComplete && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="font-medium text-green-800 dark:text-green-200">
                All done!
              </p>
            </div>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              {batchesSent} batch{batchesSent !== 1 ? "es" : ""} processed.{" "}
              {sentCount} emails sent successfully
              {failedCount > 0 && `, ${failedCount} failed`}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
