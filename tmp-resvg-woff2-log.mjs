import { Resvg } from "@resvg/resvg-js";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const woff2 = path.join(root, "assets/chart-fonts/dejavu-sans-latin-400-normal.woff2");

const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
  <text x="10" y="40" font-family="DejaVu Sans" font-size="20" fill="black">Melhoria 19</text>
</svg>`;

const resvg = new Resvg(svg, {
  logLevel: "debug",
  font: {
    loadSystemFonts: false,
    fontFiles: [woff2],
    defaultFontFamily: "DejaVu Sans",
  },
});

console.log(resvg.toString());
const png = resvg.render().asPng();
console.log("png", png.length);
