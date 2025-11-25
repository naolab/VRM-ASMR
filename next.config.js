/** @type {import('next').NextConfig} */
const basePath = process.env.NODE_ENV === 'production' ? '/VRM-ASMR' : '';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  },
  generateBuildId: async () => {
    // Generate unique build ID to prevent caching issues
    return `build-${Date.now()}`;
  }
};

module.exports = nextConfig;