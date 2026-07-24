import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The IV routes read the SVG cards + font from IV/ at runtime; file tracing
  // would otherwise drop them from the serverless bundle.
  outputFileTracingIncludes: {
    "/api/iv/**": ["./IV/**"],
    "/iv/**": ["./IV/**"],
  },
  // @resvg/resvg-js ships a native N-API addon selected via optionalDependencies
  // per-platform; bundling it breaks that resolution, so it must run through
  // native `require` instead.
  serverExternalPackages: ["@resvg/resvg-js"],
};

export default nextConfig;
