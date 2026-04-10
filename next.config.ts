import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

/** @type {import('next').NextConfig} */
    const nextConfig = {
      typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
      },
      eslint: {
        // Similarly, you can ignore ESLint errors
        ignoreDuringBuilds: true,
      },
    }

    module.exports = nextConfig
    export default nextConfig;
