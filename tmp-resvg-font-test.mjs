import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";

const fontWoff2 = path.join("assets/chart-fonts/dejavu-sans-latin-400-normal.woff2");
const fontWoff = path.join(
  "node_modules/@fontsource/dejavu-sans/files/dejavu-sans-latin-400-normal.woff",
);

const svgFiles = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
  <text x="10" y="40" font-family="DejaVu Sans" font-size="20" fill="black">Melhoria 19</text>
</svg>`;

function render(name, font) {
  const png = new Resvg(svgFiles, { font }).render().asPng();
  fs.writeFileSync(`tmp-font-${name}.png`, png);
  console.log(name, png.length);
}

render("woff2", {
  loadSystemFonts: false,
  fontFiles: [fontWoff2],
  defaultFontFamily: "DejaVu Sans",
});
render("woff", {
  loadSystemFonts: false,
  fontFiles: [fontWoff],
  defaultFontFamily: "DejaVu Sans",
});
render("none", { loadSystemFonts: false, fontFiles: [] });
render("system", { loadSystemFonts: true });
