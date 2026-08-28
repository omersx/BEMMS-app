import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // Enable for Docker deployment
  serverExternalPackages: ["pg"],
};

export default nextConfig;
