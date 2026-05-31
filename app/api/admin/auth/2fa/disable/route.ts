import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { verifyPassword } from "@/lib/auth/password";

// Turns off 2FA. Requires the current password to confirm it's really them.
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const password =
    typeof (body as Record<string, unknown>)?.password === "string"
      ? ((body as Record<string, unknown>).password as string)
      : "";

  const col = await adminsCollection();
  const doc = await col.findOne({ _id: new ObjectId(admin.id) });
  if (!doc) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifyPassword(password, doc.passwordHash))) {
    return NextResponse.json(
      { error: "Password is incorrect." },
      { status: 400 }
    );
  }

  await col.updateOne(
    { _id: doc._id },
    {
      $set: { twoFactorEnabled: false },
      $unset: {
        totpSecretEnc: "",
        totpPendingEnc: "",
        recoveryCodeHashes: "",
      },
    }
  );

  return NextResponse.json({ ok: true });
}
