// One-off generator: converts a flat path-only SVG into a *Scene.tsx component
// matching the VenueScene convention (inner markup stored as an escaped SCENE
// string, rendered via dangerouslySetInnerHTML inside a viewBox'd <svg>).
//
//   node scripts/svg-to-scene.mjs <input.svg> <ComponentName> <output.tsx>
//
// The path data is copied verbatim so the original paint order / colours are
// preserved; only the outer <svg> wrapper and XML prolog are stripped.

import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, componentName, outputPath] = process.argv;
if (!inputPath || !componentName || !outputPath) {
  console.error(
    "usage: node scripts/svg-to-scene.mjs <input.svg> <ComponentName> <output.tsx>"
  );
  process.exit(1);
}

const raw = readFileSync(inputPath, "utf8");

const viewBoxMatch = raw.match(/viewBox="([^"]+)"/);
if (!viewBoxMatch) throw new Error("no viewBox found in " + inputPath);
const viewBox = viewBoxMatch[1];

// Strip the XML prolog and the opening/closing <svg> tags, keep the inner body.
const inner = raw
  .replace(/<\?xml[^>]*\?>/i, "")
  .replace(/<svg[^>]*>/i, "")
  .replace(/<\/svg>/i, "")
  .trim();

// Escape for embedding in a double-quoted JS string literal.
const escaped = inner
  .replace(/\\/g, "\\\\")
  .replace(/"/g, '\\"')
  .replace(/\r?\n/g, "\\n");

const file = `// AUTO-GENERATED from ${inputPath} by scripts/svg-to-scene.mjs — do not
// hand-edit the path data. Colours and paint order are preserved verbatim from
// the source illustration; the artwork is scaled to its container via viewBox.

const SCENE = "${escaped}";

export default function ${componentName}({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="${viewBox}"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      dangerouslySetInnerHTML={{ __html: SCENE }}
    />
  );
}
`;

writeFileSync(outputPath, file, "utf8");
console.log(`wrote ${outputPath} (viewBox ${viewBox}, ${escaped.length} chars)`);
