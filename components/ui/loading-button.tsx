"use client";

import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<typeof Button>;

export interface LoadingButtonProps extends ButtonProps {
  /**
   * Controlled loading state. If omitted, the button manages its own pending
   * state automatically whenever `onClick` returns a promise.
   */
  loading?: boolean;
  /** Optional aria/label announced while loading (defaults to "Loading"). */
  loadingLabel?: string;
}

/**
 * A Button that, while an action is in flight, swaps its label for a centered
 * spinner and disables itself — no layout shift, consistent across the app.
 *
 * Usage:
 *   • Forms:   <LoadingButton type="submit" loading={submitting}>Save</LoadingButton>
 *   • Actions: <LoadingButton onClick={async () => { await doThing(); }}>Do</LoadingButton>
 *     (returns a promise → pending is tracked automatically)
 */
export function LoadingButton({
  loading,
  loadingLabel = "Loading",
  children,
  className,
  disabled,
  onClick,
  ...props
}: LoadingButtonProps) {
  const [pending, setPending] = React.useState(false);
  const isLoading = loading ?? pending;

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick) return;
      const result = onClick(event) as unknown;
      // Auto-track pending only in uncontrolled mode and only for async handlers.
      if (
        loading === undefined &&
        result &&
        typeof (result as Promise<unknown>).then === "function"
      ) {
        setPending(true);
        Promise.resolve(result).finally(() => setPending(false));
      }
    },
    [onClick, loading]
  );

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-live="polite"
      data-loading={isLoading ? "" : undefined}
      className={cn("relative", className)}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-opacity",
          isLoading && "opacity-0"
        )}
      >
        {children}
      </span>
      {isLoading && (
        <span className="absolute inset-0 inline-flex items-center justify-center">
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          <span className="sr-only">{loadingLabel}…</span>
        </span>
      )}
    </Button>
  );
}
