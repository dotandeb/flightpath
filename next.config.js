/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AMADEUS_API_KEY: process.env.AMADEUS_API_KEY,
    AMADEUS_API_SECRET: process.env.AMADEUS_API_SECRET,
    USE_AMADEUS: process.env.USE_AMADEUS,
  },
  // Exclude Playwright from client-side bundling
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
  // Don't bundle these for serverless functions
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium-min', 'playwright-core'],
    outputFileTracingIncludes: {
      '/api/search': ['./node_modules/@sparticuz/chromium-min/**/*'],
      '/api/stream/search': ['./node_modules/@sparticuz/chromium-min/**/*'],
      '/api/scrape-v2': ['./node_modules/@sparticuz/chromium-min/**/*'],
    },
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        ],
      },
    ];
  },
}

module.exports = nextConfig