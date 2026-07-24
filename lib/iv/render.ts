import { promises as fs } from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import { PDFDocument } from "pdf-lib";

// The IV is a two-page card set living in the repo-root IV/ folder:
// page 1 (W card-01.svg) is the static invitation; page 2 (W_card-02.svg) is
// the access card whose <text id="guest-name"> is swapped for the guest's
// name. Saol Display renders that name; other card text is outlined paths.
const IV_DIR = path.join(process.cwd(), "IV");
const PAGE1_FILE = path.join(IV_DIR, "W card-01.svg");
const PAGE2_FILE = path.join(IV_DIR, "W_card-02.svg");
const FONT_FILE = path.join(
  IV_DIR,
  "SaolDisplay-Regular",
  "SaolDisplay-Regular.ttf"
);

// viewBox is 450x324; 3x keeps the name crisp in email clients and downloads.
const RENDER_SCALE = 3;
export const CARD_WIDTH = 450;
export const CARD_HEIGHT = 324;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function loadPage1Svg(): Promise<string> {
  return fs.readFile(PAGE1_FILE, "utf8");
}

export async function personalizeAccessCard(
  guestName: string
): Promise<string> {
  const svg = await fs.readFile(PAGE2_FILE, "utf8");
  const name = guestName.trim() || "Honoured Guest";
  // .cls-3 sets font-size:10px via the SVG's <style> block, and CSS beats
  // presentation attributes — an inline style is the only override that
  // shrinks long names.
  const fontSize =
    name.length > 24 ? Math.max(6, Math.round((10 * 24 * 10) / name.length) / 10) : 10;
  const personalized = svg.replace(
    /(<text id="guest-name"[^>]*)(>)[\s\S]*?(<\/text>)/,
    `$1 style="font-size:${fontSize}px"$2<tspan x="0" y="0">${escapeXml(
      name
    )}</tspan>$3`
  );
  if (personalized === svg) {
    throw new Error("IV template missing <text id=\"guest-name\"> node");
  }
  return personalized;
}

export function renderCardPng(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: RENDER_SCALE },
    font: {
      fontFiles: [FONT_FILE],
      loadSystemFonts: false,
      defaultFontFamily: "Saol Display",
    },
  });
  return resvg.render().asPng();
}

export async function renderIvPdf(guestName: string): Promise<Uint8Array> {
  const [page1, page2] = await Promise.all([
    loadPage1Svg(),
    personalizeAccessCard(guestName),
  ]);
  const pdf = await PDFDocument.create();
  for (const svg of [page1, page2]) {
    const png = await pdf.embedPng(renderCardPng(svg));
    const page = pdf.addPage([CARD_WIDTH, CARD_HEIGHT]);
    page.drawImage(png, { x: 0, y: 0, width: CARD_WIDTH, height: CARD_HEIGHT });
  }
  return pdf.save();
}
