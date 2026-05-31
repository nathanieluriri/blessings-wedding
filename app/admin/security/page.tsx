import type { Metadata } from "next";
import { ObjectId } from "mongodb";
import { adminsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import SecurityManager from "./security-manager";

export const metadata: Metadata = { title: "Security" };
export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const admin = await getCurrentAdmin();
  const col = await adminsCollection();
  const doc = await col.findOne({ _id: new ObjectId(admin!.id) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[color:var(--primary)]">
          Security
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a second step to your sign-in for extra protection.
        </p>
      </div>
      <SecurityManager twoFactorEnabled={doc?.twoFactorEnabled ?? false} />
    </div>
  );
}
