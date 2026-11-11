import type { NextConfig } from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  customWorkerSrc: "worker",
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    cacheId: 'etshop-v1.0.1',
    exclude: [
      /\/_next\/static\/.*(?<!\.p)\.woff2/,
      /\.map$/,
      /^manifest.*\.js$/,
      /dynamic-css-manifest\.json$/,
      /middleware-manifest\.json$/,
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  allowedDevOrigins: [
    'http://192.168.101.8:3000',
    'http://localhost:3000',
    '192.168.101.8:3000',
    '192.168.101.8',
    'localhost:3000',
    'localhost'
  ],
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPWA(nextConfig);
