import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const ttf = path.join(root, "assets/chart-fonts/DejaVuSans.ttf");

const svg = fs.readFileSync(path.join(root, "node_modules/@resvg/resvg-js/README.md")).toString();
// use minimal svg
const svgText = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
  <text x="10" y="40" font-family="DejaVu Sans" font-size="20" fill="black">Melhoria 19</text>
</svg>`;

console.log("ttf exists", fs.existsSync(ttf), ttf);

const configs = [
  ["abs-ttf", { loadSystemFonts: false, fontFiles: [ttf], defaultFontFamily: "DejaVu Sans" }],
  ["abs-ttf-no-default", { loadSystemFonts: false, fontFiles: [ttf] }],
  ["abs-ttf-sans-space", { loadSystemFonts: false, fontFiles: [ttf], defaultFontFamily: "DejaVuSans" }],
];

for (const [name, font] of configs) {
  const png = new Resvg(svgText, { font }).render().asPng();
  console.log(name, png.length);
  fs.writeFileSync(path.join(root, `tmp-abs-${name}.png`), png);
}
