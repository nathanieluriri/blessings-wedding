import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="admin-shell flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <LoginForm />
    </div>
  );
}
