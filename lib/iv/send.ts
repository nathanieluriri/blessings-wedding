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
  try {
    const col = await rsvpsCollection();

    // Re-read the doc to guard against races between the auto-send (after()
    // on accept) and the bulk endpoint, which can both target the same RSVP.
    const current = await col.findOne({ _id: rsvp._id });
    if (!current) {
      return { ok: false, error: "RSVP not found" };
    }
    // Idempotent duplicate-guard: if it's already been sent, don't send again.
    if (current.ivSentAt) {
      return { ok: true };
    }

    let token = current.ivToken;
    if (!token) {
      const fresh = randomBytes(16).toString("hex");
      // Atomic mint: only set the token if nobody has minted one yet. If
      // another racer wins, findOneAndUpdate returns null (no match) and we
      // fall back to reading the winner's token.
      const updated = await col.findOneAndUpdate(
        { _id: rsvp._id, ivToken: { $exists: false } },
        { $set: { ivToken: fresh } },
        { returnDocument: "after" }
      );
      token = updated?.ivToken;
      if (!token) {
        const winner = await col.findOne({ _id: rsvp._id });
        token = winner?.ivToken;
      }
      if (!token) {
        return { ok: false, error: "Token mint failed" };
      }
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
  } catch (err) {
    console.error("[iv] send failed:", err);
    return { ok: false, error: "Send failed" };
  }
}
