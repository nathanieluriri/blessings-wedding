import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The IV routes read the SVG cards + font from IV/ at runtime; file tracing
  // would otherwise drop them from the serverless bundle.
  outputFileTracingIncludes: {
    "/api/iv/**": ["./IV/**"],
    "/iv/**": ["./IV/**"],
  },
};

export default nextConfig;
