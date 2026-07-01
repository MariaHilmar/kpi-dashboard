import packageJson from "@/package.json";

/** Versão semver do dashboard (package.json). */
export const APP_VERSION = packageJson.version;

export function formatAppVersionLabel(version: string = APP_VERSION): string {
  return `v${version}`;
}
