import { Resvg } from "@resvg/resvg-js";
import fs from "fs";

const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
  <text x="10" y="40" font-family="DejaVu Sans" font-size="20" fill="black">Melhoria 19</text>
</svg>`;

const cases = [
  ["fontDirs", { loadSystemFonts: false, fontDirs: ["assets/chart-fonts"], defaultFontFamily: "DejaVu Sans" }],
  ["fontFiles-ttf", { loadSystemFonts: false, fontFiles: ["assets/chart-fonts/DejaVuSans.ttf"], defaultFontFamily: "DejaVu Sans" }],
  ["fontFiles-woff2", { loadSystemFonts: false, fontFiles: ["assets/chart-fonts/dejavu-sans-latin-400-normal.woff2"], defaultFontFamily: "DejaVu Sans" }],
  ["both", { loadSystemFonts: false, fontDirs: ["assets/chart-fonts"], fontFiles: ["assets/chart-fonts/DejaVuSans.ttf"], defaultFontFamily: "DejaVu Sans" }],
];

for (const [name, font] of cases) {
  const png = new Resvg(svg, { font }).render().asPng();
  fs.writeFileSync(`tmp-case-${name}.png`, png);
  console.log(name, png.length);
}
