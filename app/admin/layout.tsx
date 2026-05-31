import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlertIcon, ShieldIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import AdminNav from "./nav";
import LogoutButton from "./logout-button";
import ChangePasswordDialog from "./change-password-dialog";
import { NavProgressProvider } from "./nav-progress";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login/admin");

  return (
    <div className="admin-shell min-h-svh bg-background text-foreground">
      <NavProgressProvider>
      <div className="flex min-h-svh">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
          <div className="px-3 py-2 font-serif text-lg tracking-[0.25em] text-[color:var(--primary)]">
            #OfoDiMma
          </div>
          <div className="mt-4 flex-1">
            <AdminNav />
          </div>
          <div className="border-t pt-3 text-xs text-muted-foreground">
            <div className="truncate px-3">{admin.email}</div>
            <div className="px-3 capitalize">{admin.role}</div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between gap-4 border-b bg-card px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <div className="font-serif text-base text-[color:var(--primary)] md:hidden">
                #OfoDiMma
              </div>
              <div className="hidden text-sm text-muted-foreground md:block">
                Wedding dashboard
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ChangePasswordDialog />
              <LogoutButton />
            </div>
          </header>

          {/* Mobile nav */}
          <div className="overflow-x-auto border-b bg-card px-2 py-2 md:hidden">
            <AdminNav orientation="horizontal" />
          </div>

          {admin.mustChangePassword && (
            <div className="flex items-center gap-2 border-b bg-[color:var(--accent)] px-4 py-2.5 text-sm text-[color:var(--accent-foreground)] sm:px-6">
              <TriangleAlertIcon className="size-4 shrink-0" />
              <span className="flex-1">
                You&apos;re using a temporary password. Please set a new one.
              </span>
              <ChangePasswordDialog
                defaultOpen
                trigger={<Button size="sm">Set new password</Button>}
              />
            </div>
          )}

          {!admin.mustChangePassword && !admin.twoFactorEnabled && (
            <div className="flex items-center gap-2 border-b bg-muted px-4 py-2.5 text-sm text-muted-foreground sm:px-6">
              <ShieldIcon className="size-4 shrink-0" />
              <span className="flex-1">
                Add two-factor authentication for extra protection.
              </span>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/security">Set up</Link>
              </Button>
            </div>
          )}

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
      </NavProgressProvider>
      <Toaster richColors position="top-right" />
    </div>
  );
}
