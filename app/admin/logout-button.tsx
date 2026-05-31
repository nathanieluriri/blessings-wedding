"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.replace("/login/admin");
      router.refresh();
    } catch {
      // Stay on the page if logout fails; re-enable the button.
      setLoading(false);
    }
    // On success we keep `loading` true through the redirect so the spinner
    // persists until the login page replaces this view.
  }

  return (
    <LoadingButton
      variant="outline"
      size="sm"
      loading={loading}
      onClick={handleLogout}
    >
      <LogOutIcon />
      Sign out
    </LoadingButton>
  );
}
