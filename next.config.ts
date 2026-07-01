import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@resvg/resvg-js",
    "@resvg/resvg-js-win32-x64-msvc",
    "@resvg/resvg-js-linux-x64-gnu",
  ],
  outputFileTracingIncludes: {
    "/api/analistas/export/word": [
      "./assets/chart-fonts/**/*",
      "./node_modules/@vintproykt/dejavu-fonts-ttf/ttf/DejaVuSans.ttf",
      "./node_modules/@vintproykt/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf",
      "./node_modules/@resvg/resvg-js/**/*",
      "./node_modules/@resvg/resvg-js-win32-x64-msvc/**/*",
      "./node_modules/@resvg/resvg-js-linux-x64-gnu/**/*",
    ],
    "/api/issues/export": [
      "./assets/chart-fonts/**/*",
      "./node_modules/@vintproykt/dejavu-fonts-ttf/ttf/DejaVuSans.ttf",
      "./node_modules/@vintproykt/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf",
      "./node_modules/@resvg/resvg-js/**/*",
      "./node_modules/@resvg/resvg-js-win32-x64-msvc/**/*",
      "./node_modules/@resvg/resvg-js-linux-x64-gnu/**/*",
    ],
  },
};

export default nextConfig;
