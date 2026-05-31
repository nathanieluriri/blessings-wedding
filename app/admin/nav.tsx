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
import { NavLinkContent } from "./nav-progress";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/rsvps", label: "RSVPs", icon: MailsIcon },
  { href: "/admin/admins", label: "Admins", icon: UsersIcon },
  { href: "/admin/notifications", label: "Notifications", icon: BellIcon },
  { href: "/admin/security", label: "Security", icon: ShieldIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminNav({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "gap-1",
        orientation === "vertical" ? "flex flex-col" : "flex flex-row"
      )}
    >
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);
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
