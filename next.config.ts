import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/((?!api/).*)",
        destination: "/shell",
      },
    ];
  },
};

export default nextConfig;
