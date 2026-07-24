import { NextResponse } from "next/server";
import { rsvpsCollection } from "@/lib/collections";
import {
  loadPage1Svg,
  personalizeAccessCard,
  renderCardPng,
  renderIvPdf,
} from "@/lib/iv/render";

// Serves the IV assets referenced by the invitation email and the /iv page:
//   1.png — static page-1 invitation card
//   2.png — access card personalized with the guest's name
//   pdf   — both pages as a downloadable PDF
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; asset: string }> }
) {
  const { token, asset } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const col = await rsvpsCollection();
  const doc = await col.findOne({ ivToken: token });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Token-keyed and immutable per guest — let clients cache for a day.
  const cache = "private, max-age=86400";
  try {
    if (asset === "1.png") {
      return new Response(new Uint8Array(renderCardPng(await loadPage1Svg())), {
        headers: { "Content-Type": "image/png", "Cache-Control": cache },
      });
    }
    if (asset === "2.png") {
      return new Response(
        new Uint8Array(renderCardPng(await personalizeAccessCard(doc.name))),
        { headers: { "Content-Type": "image/png", "Cache-Control": cache } }
      );
    }
    if (asset === "pdf") {
      const safeName = doc.name.replace(/[^\p{L}\p{N} .-]/gu, "").trim() || "Guest";
      return new Response(new Uint8Array(await renderIvPdf(doc.name)), {
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": cache,
          "Content-Disposition": `attachment; filename="Blessing & Justice IV - ${safeName}.pdf"`,
        },
      });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (err) {
    console.error(`[iv] render failed (${asset}):`, err);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }
}
