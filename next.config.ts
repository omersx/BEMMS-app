import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output enabled in Docker / production environments (avoids Windows symlink EPERM)
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  serverExternalPackages: ["pg", "xlsx"],
  redirects: async () => [
    {
      source: "/tickets/report",
      destination: "/tickets/create",
      permanent: true,
    },
    {
      source: "/dashboard/my-work",
      destination: "/maintenance/tasks",
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ],
};

export default nextConfig;
