// One-off: build the social-sharing card from the portrait invitation OG.png.
//
// OG.png is a 1240x1748 *portrait* card, but Open Graph / Twitter previews are
// laid out landscape (the 1.91:1 standard, 1200x630). We fill the frame: the
// image is scaled to cover the whole 1200x630 and centered, so it zooms into
// the middle of the card and crops the top & bottom off — no letterbox bars.
//
// The output is a static image picked up by app/opengraph-image.png and
// app/twitter-image.png (Next.js metadata file conventions). Re-run after
// changing OG.png:  node scripts/generate-og-image.mjs
import sharp from "sharp";

const SRC = "OG.png";
const SIZE = { width: 1200, height: 630 };
const TARGETS = ["app/opengraph-image.png", "app/twitter-image.png"];

const card = await sharp(SRC)
  .resize(SIZE.width, SIZE.height, { fit: "cover", position: "centre" })
  .png()
  .toBuffer();

for (const out of TARGETS) {
  await sharp(card).toFile(out);
  console.log(`${out}  ${SIZE.width}x${SIZE.height}  ${Math.round(card.length / 1024)}KB`);
}
