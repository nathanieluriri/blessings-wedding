// RSVP triage state machine.
//
// A submission starts as `new`. From there an admin can acknowledge it or move
// it straight to a final triage state. The four triage states are freely
// interchangeable (you can change your mind), but nothing can return to `new`.

export const RSVP_STATUSES = [
  "new",
  "acknowledged",
  "accepted",
  "rejected",
  "ignored",
] as const;

export type RsvpStatus = (typeof RSVP_STATUSES)[number];

const TRIAGE: RsvpStatus[] = ["acknowledged", "accepted", "rejected", "ignored"];

export const TRANSITIONS: Record<RsvpStatus, RsvpStatus[]> = {
  new: TRIAGE,
  acknowledged: ["accepted", "rejected", "ignored"],
  accepted: ["acknowledged", "rejected", "ignored"],
  rejected: ["acknowledged", "accepted", "ignored"],
  ignored: ["acknowledged", "accepted", "rejected"],
};

export function isRsvpStatus(value: unknown): value is RsvpStatus {
  return (
    typeof value === "string" && RSVP_STATUSES.includes(value as RsvpStatus)
  );
}

export function canTransition(from: RsvpStatus, to: RsvpStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

// Display metadata for badges / labels.
export const STATUS_META: Record<RsvpStatus, { label: string }> = {
  new: { label: "New" },
  acknowledged: { label: "Acknowledged" },
  accepted: { label: "Accepted" },
  rejected: { label: "Rejected" },
  ignored: { label: "Ignored" },
};

// Single source of truth for status colour coding, shared by badges, the filter
// tabs and the action menu so the colour language is consistent everywhere.
//   • dot      — small indicator swatch (`bg-*`)
//   • solid    — filled badge (`bg-* text-*`)
//   • soft     — tinted chip for active tabs (`bg-* text-*`)
// Semantic, high-contrast hues: new = needs attention (amber), acknowledged =
// seen (sky), accepted = yes (emerald), rejected = no (red), ignored = muted.
export interface StatusColor {
  dot: string; // small vivid swatch (the colour signal)
  // Badge / chip fill. Light tint + dark text so labels meet WCAG AA contrast
  // (vivid fills like amber-500 + white fail). Matches the active-tab tints.
  chip: string;
  // Active-tab classes. Kept as full literal strings (incl. the
  // `data-[state=active]:` variant) so Tailwind's scanner picks them up — they
  // must NOT be assembled at runtime, or the CSS won't be generated.
  tab: string;
}

export const STATUS_COLOR: Record<RsvpStatus, StatusColor> = {
  new: {
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-900",
    tab: "data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900",
  },
  acknowledged: {
    dot: "bg-sky-500",
    chip: "bg-sky-100 text-sky-900",
    tab: "data-[state=active]:bg-sky-100 data-[state=active]:text-sky-900",
  },
  accepted: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-900",
    tab: "data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900",
  },
  rejected: {
    dot: "bg-red-500",
    chip: "bg-red-100 text-red-900",
    tab: "data-[state=active]:bg-red-100 data-[state=active]:text-red-900",
  },
  ignored: {
    dot: "bg-zinc-400",
    chip: "bg-zinc-200 text-zinc-800",
    tab: "data-[state=active]:bg-zinc-200 data-[state=active]:text-zinc-800",
  },
};

// The "All" filter (not a real status) uses the brand burgundy.
export const ALL_FILTER_COLOR: StatusColor = {
  dot: "bg-[color:var(--primary)]",
  chip: "bg-[color:var(--secondary)] text-[color:var(--primary)]",
  tab: "data-[state=active]:bg-[color:var(--secondary)] data-[state=active]:text-[color:var(--primary)]",
};
