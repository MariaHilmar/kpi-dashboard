import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";

const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
  <text x="10" y="40" font-family="DejaVu Sans" font-size="20" fill="black">Melhoria 19</text>
</svg>`;

const ttf = [
  path.join("assets/chart-fonts/DejaVuSans.ttf"),
  path.join("assets/chart-fonts/DejaVuSans-Bold.ttf"),
];

const png = new Resvg(svg, {
  font: {
    loadSystemFonts: false,
    fontFiles: ttf,
    defaultFontFamily: "DejaVu Sans",
  },
}).render().asPng();

fs.writeFileSync("tmp-font-ttf.png", png);
console.log("ttf bytes", png.length);
