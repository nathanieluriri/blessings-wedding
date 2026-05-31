"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import { useLinkStatus } from "next/link";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Shared progress state ───────────────────────────────────────────────────
// Nav links report their pending state here; the top bar shows whenever any
// navigation is in flight. Ref-counted so multiple quick clicks behave.

type NavProgressCtx = { start: () => void; stop: () => void };

const NavProgressContext = createContext<NavProgressCtx>({
  start: () => {},
  stop: () => {},
});

export function useNavProgress() {
  return useContext(NavProgressContext);
}

export function NavProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const start = useCallback(() => setActive((n) => n + 1), []);
  const stop = useCallback(() => setActive((n) => Math.max(0, n - 1)), []);
  // Stable reference so NavLinkContent's effect doesn't re-run every render.
  const value = useMemo(() => ({ start, stop }), [start, stop]);

  return (
    <NavProgressContext.Provider value={value}>
      {/* Fixed top bar. Only mounted while navigating; CSS delays its reveal so
          fast (prefetched/cached) navigations never flash a bar. `status` (an
          implicit polite live region) suits an indeterminate indicator —
          `progressbar` would require an aria-valuenow we don't have. */}
      {active > 0 && (
        <div className="admin-navprogress" role="status" aria-label="Loading page">
          <span className="admin-navprogress__bar" />
        </div>
      )}
      {children}
    </NavProgressContext.Provider>
  );
}

// ── Per-link pending indicator ──────────────────────────────────────────────
// Rendered INSIDE a <Link> so it can read useLinkStatus(). Swaps the link's
// leading icon for a spinner while that link's navigation is pending, and
// drives the global top bar. No layout shift (icon and spinner are the same
// size).

export function NavLinkContent({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  const { pending } = useLinkStatus();
  const { start, stop } = useNavProgress();

  useEffect(() => {
    if (!pending) return;
    start();
    return () => stop();
  }, [pending, start, stop]);

  return (
    <>
      {pending ? (
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
      ) : (
        <Icon className="size-4" />
      )}
      <span className={cn(pending && "opacity-70")}>{label}</span>
    </>
  );
}
