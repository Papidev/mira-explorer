import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import { version } from "./package.json";

const getCommit = () => {
  if (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  }
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

const nextConfig: NextConfig = {
  env: {
    APP_VERSION: version,
    APP_COMMIT: getCommit(),
  },
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thumb.wikimedia.org",
        port: "",
        pathname: "/wikipedia/commons/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        port: "",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },
};

export default nextConfig;
