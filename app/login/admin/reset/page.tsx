import type { Metadata } from "next";
import ResetForm from "./reset-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="admin-shell flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <ResetForm token={token ?? ""} />
    </div>
  );
}
