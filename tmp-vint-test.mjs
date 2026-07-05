import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const ttf = path.join(root, "node_modules/@vintproykt/dejavu-fonts-ttf/ttf/DejaVuSans.ttf");
const bold = path.join(root, "node_modules/@vintproykt/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf");

const b = fs.readFileSync(ttf);
console.log("magic", b.subarray(0, 4).toString("hex"), "size", b.length);

const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
  <text x="10" y="40" font-family="DejaVu Sans" font-size="20" fill="black">Melhoria 19</text>
</svg>`;

const png = new Resvg(svg, {
  logLevel: "warn",
  font: {
    loadSystemFonts: false,
    fontFiles: [ttf, bold],
    defaultFontFamily: "DejaVu Sans",
    sansSerifFamily: "DejaVu Sans",
  },
}).render().asPng();

fs.writeFileSync(path.join(root, "tmp-vint-ttf.png"), png);
console.log("png", png.length);
