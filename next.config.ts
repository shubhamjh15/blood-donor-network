import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "bcryptjs"],
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  // Pin the workspace root (a stray lockfile higher up confuses inference)
  turbopack: { root: path.resolve(".") },
  outputFileTracingRoot: path.resolve("."),
};

export default nextConfig;
