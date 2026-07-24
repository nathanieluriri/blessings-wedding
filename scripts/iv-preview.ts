// Renders sample IV output for visual inspection.
// Usage: npx tsx scripts/iv-preview.ts <outputDir> [guest name]
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import {
  loadPage1Svg,
  personalizeAccessCard,
  renderCardPng,
  renderIvPdf,
} from "../lib/iv/render";

async function main() {
  const outDir = process.argv[2] ?? "iv-preview-out";
  const name = process.argv[3] ?? "Olivia Bennett";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    path.join(outDir, "page1.png"),
    renderCardPng(await loadPage1Svg())
  );
  writeFileSync(
    path.join(outDir, "page2.png"),
    renderCardPng(await personalizeAccessCard(name))
  );
  writeFileSync(path.join(outDir, "iv.pdf"), await renderIvPdf(name));
  console.log(`Wrote page1.png, page2.png, iv.pdf to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
