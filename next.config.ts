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
      "./node_modules/@fontsource/dejavu-sans/files/dejavu-sans-latin-400-normal.woff2",
      "./node_modules/@fontsource/dejavu-sans/files/dejavu-sans-latin-700-normal.woff2",
      "./node_modules/@resvg/resvg-js/**/*",
      "./node_modules/@resvg/resvg-js-win32-x64-msvc/**/*",
      "./node_modules/@resvg/resvg-js-linux-x64-gnu/**/*",
    ],
  },
};

export default nextConfig;
