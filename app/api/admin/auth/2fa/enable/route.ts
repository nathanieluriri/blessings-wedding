import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { decryptSecret } from "@/lib/auth/crypto";
import { verifyTotp } from "@/lib/auth/totp";
import { generateRecoveryCodes, hashRecoveryCodes } from "@/lib/auth/recovery";

// Confirms enrollment: verifies a code against the pending secret, activates
// 2FA, and returns fresh recovery codes (shown once — only hashes are stored).
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
  const code =
    typeof (body as Record<string, unknown>)?.code === "string"
      ? ((body as Record<string, unknown>).code as string)
      : "";

  const col = await adminsCollection();
  const doc = await col.findOne({ _id: new ObjectId(admin.id) });
  if (!doc?.totpPendingEnc) {
    return NextResponse.json(
      { error: "Start two-factor setup first." },
      { status: 400 }
    );
  }

  let secret: string;
  try {
    secret = decryptSecret(doc.totpPendingEnc);
  } catch {
    return NextResponse.json(
      { error: "Setup data was corrupted. Please start again." },
      { status: 400 }
    );
  }

  if (!verifyTotp(secret, code)) {
    return NextResponse.json(
      { error: "That code didn't match. Try again." },
      { status: 400 }
    );
  }

  const recoveryCodes = generateRecoveryCodes();
  const recoveryCodeHashes = await hashRecoveryCodes(recoveryCodes);
  await col.updateOne(
    { _id: doc._id },
    {
      $set: {
        twoFactorEnabled: true,
        totpSecretEnc: doc.totpPendingEnc,
        recoveryCodeHashes,
      },
      $unset: { totpPendingEnc: "" },
    }
  );

  return NextResponse.json({ ok: true, recoveryCodes });
}
