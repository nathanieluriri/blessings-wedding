import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (admin.role !== "root") {
    return NextResponse.json(
      { error: "Only a root admin can remove admins." },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json(
      { error: "You can't remove your own account." },
      { status: 400 }
    );
  }

  let _id: ObjectId;
  try {
    _id = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const col = await adminsCollection();
  const result = await col.deleteOne({ _id });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
