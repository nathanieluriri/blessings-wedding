// Runs once when a Next.js server instance boots. We use it to seed the root
// admin from env vars when the admins collection is empty.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn(
      "[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping root admin seed."
    );
    return;
  }

  try {
    // Dynamically imported so these node-only modules never reach the edge.
    const { adminsCollection } = await import("@/lib/collections");
    const { hashPassword } = await import("@/lib/auth/password");

    const col = await adminsCollection();
    const count = await col.countDocuments({}, { limit: 1 });
    if (count > 0) return;

    await col.insertOne({
      email: email.toLowerCase().trim(),
      passwordHash: await hashPassword(password),
      name: "Root Admin",
      role: "root",
      mustChangePassword: false,
      createdAt: new Date(),
    });
    console.log(`[seed] Created root admin: ${email}`);
  } catch (err) {
    console.error("[seed] Failed to seed root admin:", err);
  }
}
