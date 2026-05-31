import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import QRCode from "qrcode";
import { adminsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { encryptSecret } from "@/lib/auth/crypto";
import { generateTotpSecret, totpAuthUri } from "@/lib/auth/totp";

// Begins TOTP enrollment: mints a secret, stashes it (encrypted) as pending,
// and returns a QR + the raw secret for the authenticator app. The secret only
// becomes active after a code is verified at /2fa/enable.
export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = generateTotpSecret();
  const col = await adminsCollection();
  await col.updateOne(
    { _id: new ObjectId(admin.id) },
    { $set: { totpPendingEnc: encryptSecret(secret) } }
  );

  const qr = await QRCode.toDataURL(totpAuthUri(secret, admin.email));
  return NextResponse.json({ qr, secret });
}
