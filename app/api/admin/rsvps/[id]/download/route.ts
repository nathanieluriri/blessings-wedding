import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { rsvpsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import {
  personalizeAccessCard,
  renderCardPng,
  renderIvPdf,
} from "@/lib/iv/render";

// Lets an admin download an accepted guest's invitation card as PNG, SVG or
// PDF straight from the RSVPs table — GET /api/admin/rsvps/[id]/download?type=png|svg|pdf
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let _id: ObjectId;
  try {
    _id = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const col = await rsvpsCollection();
  const doc = await col.findOne({ _id });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doc.status !== "accepted") {
    return NextResponse.json(
      { error: "Only accepted RSVPs have an invitation card." },
      { status: 422 }
    );
  }

  const type = new URL(request.url).searchParams.get("type") ?? "pdf";
  const safeName = doc.name.replace(/[^\p{L}\p{N} .-]/gu, "").trim() || "Guest";
  const filename = `Blessing & Justice IV - ${safeName}`;

  try {
    if (type === "svg") {
      const svg = await personalizeAccessCard(doc.name);
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="${filename}.svg"`,
        },
      });
    }
    if (type === "png") {
      const png = renderCardPng(await personalizeAccessCard(doc.name));
      return new Response(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${filename}.png"`,
        },
      });
    }
    if (type === "pdf") {
      const pdf = await renderIvPdf(doc.name);
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    }
    return NextResponse.json({ error: "Unknown file type" }, { status: 400 });
  } catch (err) {
    console.error(`[admin] download failed (${type}):`, err);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }
}
