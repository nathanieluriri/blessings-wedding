import { Skeleton } from "@/components/ui/skeleton";

// Instant fallback shown while an admin page's server data loads (and while it
// compiles in dev), so navigation never feels frozen. Wraps every /admin/*
// page segment via the App Router's Suspense boundary. For very fast
// (cached/prefetched) loads it may not appear at all — intentional, so quick
// navigations don't flash a skeleton.
export default function AdminLoading() {
  return (
    <div className="admin-shell space-y-6" aria-busy aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <Skeleton className="h-8 w-full max-w-md" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
