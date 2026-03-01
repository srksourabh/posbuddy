"use client";

import { Button } from "@/components/ui/button";

export default function FseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
