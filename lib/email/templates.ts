// Plain-HTML email templates with inlined styles (email clients ignore <style>
// blocks and external CSS). Each builder returns { subject, html, text }.
//
// The palette and type mirror the public wedding site (app/globals.css):
// burgundy + gold + cream, a gold "#OfoDiMma" wordmark over the couple's names,
// serif body copy and sans, letter-spaced labels.

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

const HASHTAG = "#OfoDiMma";
const COUPLE = "Blessing & Justice";

// Site theme tokens (see app/globals.css :root / .admin-shell).
const BURGUNDY = "#5a1a1a";
const GOLD = "#c9a96b";
const CREAM = "#faf6f0";
const CREAM_DEEP = "#efe4d2";
const INK = "#2a1a14";
const MUTED = "#836a5c";
const BORDER = "#e7d8c4";

const SERIF = `Georgia,'Times New Roman',serif`;
const SANS = `Arial,Helvetica,sans-serif`;

/** Escape user-provided strings before interpolating into HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${CREAM};font-family:${SERIF};color:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
          <tr><td style="background:${BURGUNDY};padding:28px 28px 24px;text-align:center;">
            <div style="color:${GOLD};font-family:${SANS};font-size:13px;font-weight:bold;letter-spacing:0.3em;text-transform:uppercase;">${HASHTAG}</div>
            <div style="color:${CREAM};font-family:${SERIF};font-style:italic;font-size:24px;margin-top:8px;">${esc(
    COUPLE
  )}</div>
          </td></tr>
          <tr><td style="height:4px;line-height:4px;font-size:0;background:${GOLD};">&nbsp;</td></tr>
          <tr><td style="padding:34px 30px 28px;">
            <h1 style="margin:0 0 18px;font-family:${SERIF};font-weight:normal;font-size:22px;color:${BURGUNDY};">${heading}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:20px 30px 24px;border-top:1px solid ${CREAM_DEEP};background:${CREAM};text-align:center;">
            <div style="color:${GOLD};font-size:14px;letter-spacing:0.4em;">&middot; &middot; &middot;</div>
            <div style="margin-top:8px;font-family:${SANS};font-size:12px;line-height:1.6;color:${MUTED};">
              ${esc(COUPLE)} &middot; Wedding Dashboard<br>
              You're receiving this because you manage the wedding site.
            </div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const P = `margin:0 0 14px;font-size:15px;line-height:1.65;color:${INK};`;
const FINE = `margin:0;font-size:13px;line-height:1.6;color:${MUTED};`;

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 20px;"><tr><td align="center" style="border-radius:999px;background:${BURGUNDY};">
    <a href="${href}" style="display:inline-block;padding:13px 30px;border:1px solid ${GOLD};border-radius:999px;color:${CREAM};text-decoration:none;font-family:${SANS};font-size:14px;letter-spacing:0.08em;text-transform:uppercase;">${label}</a>
  </td></tr></table>`;
}

function codeBox(value: string): string {
  return `<div style="margin:4px 0 20px;padding:16px 18px;background:${CREAM};border:1px dashed ${GOLD};border-radius:10px;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:bold;letter-spacing:6px;text-align:center;color:${BURGUNDY};">${value}</div>`;
}

// ── New RSVP notification ──────────────────────────────────────────────────

export function newRsvpEmail(rsvp: {
  name: string;
  attending: "yes" | "no";
  email?: string;
  phone?: string;
  message?: string;
  adminUrl: string;
}): BuiltEmail {
  const status = rsvp.attending === "yes" ? "Attending 🎉" : "Not attending";
  const subject = `New RSVP — ${rsvp.name} (${
    rsvp.attending === "yes" ? "attending" : "not attending"
  })`;
  const rows = [
    `<p style="${P}"><strong>Name:</strong> ${esc(rsvp.name)}</p>`,
    `<p style="${P}"><strong>Response:</strong> ${status}</p>`,
    rsvp.email
      ? `<p style="${P}"><strong>Email:</strong> ${esc(rsvp.email)}</p>`
      : "",
    rsvp.phone
      ? `<p style="${P}"><strong>Phone:</strong> ${esc(rsvp.phone)}</p>`
      : "",
    rsvp.message
      ? `<p style="${P}"><strong>Message:</strong><br>${esc(rsvp.message)}</p>`
      : "",
  ].join("");
  const html = layout(
    "A new RSVP just arrived",
    `${rows}${button(rsvp.adminUrl, "View in dashboard")}`
  );
  const text = `New RSVP from ${rsvp.name} — ${status}\n${
    rsvp.email ? `Email: ${rsvp.email}\n` : ""
  }${rsvp.phone ? `Phone: ${rsvp.phone}\n` : ""}${
    rsvp.message ? `Message: ${rsvp.message}\n` : ""
  }\nView: ${rsvp.adminUrl}`;
  return { subject, html, text };
}

// ── Admin invite (system-generated temporary password) ─────────────────────

export function adminInviteEmail(opts: {
  tempPassword: string;
  loginUrl: string;
  invitedBy?: string;
}): BuiltEmail {
  const subject = `You've been invited to the ${HASHTAG} admin dashboard`;
  const html = layout(
    "You've been added as an admin",
    `<p style="${P}">${
      opts.invitedBy ? `${esc(opts.invitedBy)} added you` : "You've been added"
    } to the wedding dashboard. Use the temporary password below to sign in:</p>
    ${codeBox(esc(opts.tempPassword))}
    ${button(opts.loginUrl, "Sign in")}
    <p style="${P}">You'll be asked to set your own password on first sign-in. For security, please enable two-factor authentication from the Security page afterwards.</p>
    <p style="${FINE}">If you weren't expecting this, you can ignore this email.</p>`
  );
  const text = `You've been added as an admin to the ${HASHTAG} dashboard.\nTemporary password: ${opts.tempPassword}\nSign in: ${opts.loginUrl}\nYou'll set your own password on first sign-in.`;
  return { subject, html, text };
}

// ── Password reset link ────────────────────────────────────────────────────

export function passwordResetEmail(opts: {
  resetUrl: string;
  expiresMinutes: number;
}): BuiltEmail {
  const subject = `Reset your ${HASHTAG} admin password`;
  const html = layout(
    "Reset your password",
    `<p style="${P}">We received a request to reset your admin password. Click below to choose a new one:</p>
    ${button(opts.resetUrl, "Reset password")}
    <p style="${P}">This link expires in ${opts.expiresMinutes} minutes and can be used once.</p>
    <p style="${FINE}">If you didn't request this, no action is needed — your password stays the same.</p>`
  );
  const text = `Reset your ${HASHTAG} admin password:\n${opts.resetUrl}\nThis link expires in ${opts.expiresMinutes} minutes and can be used once. If you didn't request it, ignore this email.`;
  return { subject, html, text };
}

// ── Email-OTP 2FA fallback code ────────────────────────────────────────────

export function loginCodeEmail(opts: {
  code: string;
  expiresMinutes: number;
  loginUrl: string;
}): BuiltEmail {
  const subject = `Your ${HASHTAG} sign-in code: ${opts.code}`;
  const html = layout(
    "Your sign-in code",
    `<p style="${P}">Enter this code on the sign-in page to finish signing in:</p>
    ${codeBox(opts.code)}
    ${button(opts.loginUrl, "Go to sign-in")}
    <p style="${P}">It expires in ${opts.expiresMinutes} minutes.</p>
    <p style="${FINE}">If you didn't try to sign in, change your password right away.</p>`
  );
  const text = `Your ${HASHTAG} sign-in code is ${opts.code}. It expires in ${opts.expiresMinutes} minutes.\nSign in: ${opts.loginUrl}\nIf you didn't try to sign in, change your password right away.`;
  return { subject, html, text };
}
