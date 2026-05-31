import type { Metadata } from "next";
import ForgotForm from "./forgot-form";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="admin-shell flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <ForgotForm />
    </div>
  );
}
