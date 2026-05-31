import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { adminsCollection, type AdminDoc } from "../collections";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export interface CurrentAdmin {
  id: string;
  email: string;
  name?: string;
  role: "root" | "admin";
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
}

/**
 * Reads + verifies the session cookie and loads the admin from the DB.
 * Returns null when unauthenticated or the account no longer exists.
 * Call this in every admin page / route handler (defense in depth — the proxy
 * is not the only gate).
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  let _id: ObjectId;
  try {
    _id = new ObjectId(payload.sub);
  } catch {
    return null;
  }

  const col = await adminsCollection();
  const admin = await col.findOne({ _id });
  if (!admin) return null;

  return toCurrentAdmin(admin);
}

export function toCurrentAdmin(admin: AdminDoc): CurrentAdmin {
  return {
    id: admin._id!.toHexString(),
    email: admin.email,
    name: admin.name,
    role: admin.role,
    mustChangePassword: admin.mustChangePassword ?? false,
    twoFactorEnabled: admin.twoFactorEnabled ?? false,
  };
}
