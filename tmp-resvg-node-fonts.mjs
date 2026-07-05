import { Resvg } from "@resvg/resvg-js";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

const fonts = [
  path.join(root, "node_modules/@fontsource/dejavu-sans/files/dejavu-sans-latin-400-normal.woff"),
  path.join(root, "node_modules/@fontsource/dejavu-sans/files/dejavu-sans-latin-400-normal.woff2"),
];

const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
  <text x="10" y="40" font-family="DejaVu Sans" font-size="20" fill="black">Melhoria 19</text>
</svg>`;

for (const fontFile of fonts) {
  console.log("\n===", path.basename(fontFile), "===");
  const resvg = new Resvg(svg, {
    logLevel: "warn",
    font: { loadSystemFonts: false, fontFiles: [fontFile], defaultFontFamily: "DejaVu Sans" },
  });
  const png = resvg.render().asPng();
  console.log("png", png.length);
}
