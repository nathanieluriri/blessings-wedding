import { randomBytes } from "crypto";
import type { ObjectId } from "mongodb";
import { rsvpsCollection } from "@/lib/collections";
import { sendEmail } from "@/lib/email/send";
import { ivInviteEmail } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Sends the guest their IV email, minting the public token on first use and
 * stamping `ivSentAt` on success. Never throws — mirrors sendEmail's contract
 * so callers in request paths can't be broken by delivery failures.
 */
export async function sendIvEmail(rsvp: {
  _id: ObjectId;
  name: string;
  email: string;
  ivToken?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const col = await rsvpsCollection();

  let token = rsvp.ivToken;
  if (!token) {
    token = randomBytes(16).toString("hex");
    await col.updateOne({ _id: rsvp._id }, { $set: { ivToken: token } });
  }

  const base = getSiteUrl();
  const built = ivInviteEmail({
    guestName: rsvp.name,
    inviteUrl: `${base}/iv/${token}`,
    page1PngUrl: `${base}/api/iv/${token}/1.png`,
    page2PngUrl: `${base}/api/iv/${token}/2.png`,
    pdfUrl: `${base}/api/iv/${token}/pdf`,
  });

  const result = await sendEmail({ to: rsvp.email, ...built });
  if (result.ok) {
    await col.updateOne(
      { _id: rsvp._id },
      { $set: { ivSentAt: new Date(), updatedAt: new Date() } }
    );
  }
  return result;
}
