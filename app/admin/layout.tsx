import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import AdminNav, { AdminBottomNav } from "./nav";
import LogoutButton from "./logout-button";
import ChangePasswordDialog from "./change-password-dialog";
import { NavProgressProvider } from "./nav-progress";
import TwoFactorOnboarding from "./_components/two-factor-onboarding";

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
        {/* Sidebar (desktop). Sticky full-height so nav stays in view while the
            content column scrolls. */}
        <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
          <div className="px-3 py-2 font-serif text-lg tracking-[0.25em] text-[color:var(--primary)]">
            #OfoDiMma
          </div>
          <div className="mt-5 flex-1">
            <AdminNav />
          </div>
          <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
            <div className="truncate px-3 font-medium text-foreground/80">
              {admin.email}
            </div>
            <div className="px-3 capitalize">{admin.role}</div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <div className="truncate font-serif text-base tracking-[0.15em] text-[color:var(--primary)] md:hidden">
                #OfoDiMma
              </div>
              <div className="hidden text-sm text-muted-foreground md:block">
                Wedding dashboard
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <ChangePasswordDialog />
              <LogoutButton />
            </div>
          </header>

          {admin.mustChangePassword && (
            <div className="flex flex-col gap-2 border-b bg-[color:var(--accent)] px-4 py-3 text-sm text-[color:var(--accent-foreground)] sm:flex-row sm:items-center sm:py-2.5 sm:px-6">
              <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 sm:mt-0" />
                <span className="flex-1">
                  You&apos;re using a temporary password. Please set a new one.
                </span>
              </div>
              <ChangePasswordDialog
                defaultOpen
                trigger={
                  <Button size="sm" className="w-full sm:w-auto">
                    Set new password
                  </Button>
                }
              />
            </div>
          )}

          {/* 2FA onboarding modal (replaces the old static banner). Receives
              only the two booleans it needs — never the full admin object. */}
          <TwoFactorOnboarding
            twoFactorEnabled={admin.twoFactorEnabled}
            mustChangePassword={admin.mustChangePassword}
          />

          {/* pb leaves room for the fixed mobile bottom tab bar so content is
              never hidden behind it; reset at md+ where the sidebar is used. */}
          <main className="flex-1 p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile primary navigation: fixed bottom tab bar (< md). */}
      <AdminBottomNav />
      </NavProgressProvider>
      <Toaster richColors position="top-right" />
    </div>
  );
}
