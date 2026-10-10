import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the little "N" dev badge so it never shows up in a recording.
  devIndicators: false,
  images: { unoptimized: true },
};

export default nextConfig;
