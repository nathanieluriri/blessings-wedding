"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  MailsIcon,
  UsersIcon,
  BellIcon,
  ShieldIcon,
  SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLinkContent, BottomNavLinkContent } from "./nav-progress";

export const LINKS = [
  { href: "/admin", label: "Dashboard", short: "Home", icon: LayoutDashboardIcon },
  { href: "/admin/rsvps", label: "RSVPs", short: "RSVPs", icon: MailsIcon },
  { href: "/admin/admins", label: "Admins", short: "Admins", icon: UsersIcon },
  {
    href: "/admin/notifications",
    label: "Notifications",
    short: "Alerts",
    icon: BellIcon,
  },
  { href: "/admin/security", label: "Security", short: "Security", icon: ShieldIcon },
  { href: "/admin/settings", label: "Settings", short: "Settings", icon: SettingsIcon },
];

function isActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

/**
 * Desktop sidebar navigation (vertical list of labelled links). The mobile
 * primary navigation is the fixed bottom tab bar — see `AdminBottomNav`.
 */
export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            // prefetch disabled so useLinkStatus reliably reports pending and
            // the user always gets navigation feedback on these dynamic pages.
            prefetch={false}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <NavLinkContent icon={Icon} label={label} />
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Mobile primary navigation: a fixed, thumb-friendly bottom tab bar (< md).
 * Six destinations, each a tall touch target (≥ 56px) with icon + tiny label.
 * The active tab is burgundy with a gold pill indicator above it. Hidden at
 * md+ where the left sidebar takes over.
 */
export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="admin-bottomnav fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/95 backdrop-blur md:hidden"
    >
      {LINKS.map(({ href, short, label, icon: Icon }) => {
        const active = isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            // prefetch disabled so useLinkStatus reliably reports pending and
            // the user always gets navigation feedback on these dynamic pages.
            prefetch={false}
            className={cn(
              "admin-bottomnav__item group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-2 text-[0.625rem] font-medium leading-none outline-none transition-colors focus-visible:bg-sidebar-accent/50",
              active
                ? "text-[color:var(--primary)]"
                : "text-muted-foreground active:text-[color:var(--primary)]"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "admin-bottomnav__pill absolute inset-x-3 top-0 h-0.5 rounded-full transition-opacity",
                active ? "bg-[color:var(--gold)] opacity-100" : "opacity-0"
              )}
            />
            <BottomNavLinkContent icon={Icon} label={short} active={active} />
          </Link>
        );
      })}
    </nav>
  );
}
