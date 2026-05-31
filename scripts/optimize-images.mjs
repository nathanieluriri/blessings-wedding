// One-off: recompress the wedding hero photos from PNG (~3.6MB total) to WebP.
// The originals are 1240x1748; we keep that resolution (they go full-bleed) and
// lean on WebP to cut the payload ~5x. Run: node scripts/optimize-images.mjs
import sharp from "sharp";

const dir = "public/wedding";
for (const n of [1, 2, 3, 4]) {
  const src = `${dir}/${n}.png`;
  const out = `${dir}/${n}.webp`;
  const info = await sharp(src).webp({ quality: 80, effort: 5 }).toFile(out);
  console.log(`${n}.webp ${Math.round(info.size / 1024)}KB`);
}
