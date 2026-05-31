import type { Metadata } from "next";
import { adminsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import AdminsManager, { type AdminRow } from "./admins-manager";

export const metadata: Metadata = { title: "Admins" };
export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const current = await getCurrentAdmin();
  const col = await adminsCollection();
  const docs = await col.find().sort({ createdAt: 1 }).toArray();

  const admins: AdminRow[] = docs.map((d) => ({
    id: d._id!.toHexString(),
    email: d.email,
    name: d.name,
    role: d.role,
    createdAt: d.createdAt.toISOString(),
    createdBy: d.createdBy,
    mustChangePassword: d.mustChangePassword ?? false,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[color:var(--primary)]">
          Admins
        </h1>
        <p className="text-sm text-muted-foreground">
          Invite teammates — they get an emailed temporary password and set
          their own on first sign-in. Only a root admin can remove admins.
        </p>
      </div>
      <AdminsManager
        admins={admins}
        currentId={current!.id}
        currentEmail={current!.email}
        currentRole={current!.role}
      />
    </div>
  );
}
