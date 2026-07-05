import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import { buildDistribuicaoPieChartSvgForTest } from "./lib/dashboard/analistas-pie-chart.ts";

const rows = [
  { label: "Melhoria", total: 19, abertas: 0, fechadas: 19, pct_conclusao: 100 },
  { label: "Bug", total: 1, abertas: 0, fechadas: 1, pct_conclusao: 100 },
];
const svg = buildDistribuicaoPieChartSvgForTest("Distribuição por tipo", rows);

const current = new Resvg(svg, {
  font: {
    loadSystemFonts: false,
    fontDirs: ["assets/chart-fonts"],
    fontFiles: [
      "assets/chart-fonts/dejavu-sans-latin-400-normal.woff2",
      "assets/chart-fonts/dejavu-sans-latin-700-normal.woff2",
    ],
    defaultFontFamily: "DejaVu Sans",
  },
}).render().asPng();

const withTtf = new Resvg(svg, {
  font: {
    loadSystemFonts: false,
    fontDirs: ["assets/chart-fonts"],
    fontFiles: ["assets/chart-fonts/DejaVuSans.ttf", "assets/chart-fonts/DejaVuSans-Bold.ttf"],
    defaultFontFamily: "DejaVu Sans",
  },
}).render().asPng();

const withSystem = new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();

console.log("current woff2", current.length);
console.log("ttf", withTtf.length);
console.log("system", withSystem.length);
console.log("current==system", Buffer.compare(current, withSystem) === 0);
console.log("ttf==system", Buffer.compare(withTtf, withSystem) === 0);

fs.writeFileSync("tmp-current-prod-config.png", current);
fs.writeFileSync("tmp-with-ttf-config.png", withTtf);
fs.writeFileSync("tmp-with-system.png", withSystem);
