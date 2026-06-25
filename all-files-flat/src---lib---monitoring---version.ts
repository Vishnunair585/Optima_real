export const APP_VERSION = process.env.APP_VERSION || "1.0.0";
export const BUILD_NUMBER = process.env.BUILD_NUMBER || "dev";
export const COMMIT_HASH = process.env.COMMIT_HASH || "unknown";

export function getVersionInfo() {
  return {
    version: APP_VERSION,
    build: BUILD_NUMBER,
    commit: COMMIT_HASH,
    deployedAt: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
  };
}
