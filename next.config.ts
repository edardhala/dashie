import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Test builds can use their own folder (NEXT_DIST_DIR=.next-test) so they never
  // overwrite the files a running `npm run dev` is serving.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    // Pin the project root (there's a stray package-lock.json in the home folder).
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
