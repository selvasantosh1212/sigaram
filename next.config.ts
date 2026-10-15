import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The full-mock bank is read with fs at runtime from a computed path; list it
  // explicitly so serverless deployments always bundle it.
  outputFileTracingIncludes: {
    // Sessions are built in the /full-mock page's server action.
    "/full-mock": ["./content/full-mock-bank/**/*.json"],
    "/full-mock/**": ["./content/full-mock-bank/**/*.json"],
  },
};

export default nextConfig;
