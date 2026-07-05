import { buildDistribuicaoPieChartPng } from "./lib/dashboard/analistas-pie-chart.ts";
import fs from "fs";

const rows = [
  { label: "Melhoria", total: 19, abertas: 0, fechadas: 19, pct_conclusao: 100 },
  { label: "Bug", total: 1, abertas: 0, fechadas: 1, pct_conclusao: 100 },
];

const png = await buildDistribuicaoPieChartPng("Distribuição por tipo", rows);
fs.writeFileSync("tmp-after-fix.png", png);
console.log("png", png.length);
