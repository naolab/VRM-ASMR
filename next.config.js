/** @type {import('next').NextConfig} */
const basePath = process.env.NODE_ENV === 'production' ? '/vrm-asmr' : '';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  }
};

module.exports = nextConfig;