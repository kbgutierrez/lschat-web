/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // List all CommonJS modules that use dynamic require statements
    serverComponentsExternalPackages: ['formidable', 'superagent']
  },
  // Add webpack configuration to handle dynamic imports
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side fixes for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        os: false,
        http: false,
        https: false,
        zlib: false
      };
    }

    // Handle specific problematic packages - tell webpack to ignore dynamic requires
    config.module.rules.push({
      test: /node_modules\/(formidable|superagent\/node_modules\/formidable)\/.*\.js$/,
      loader: 'string-replace-loader',
      options: {
        search: 'require(path.join(__dirname,',
        replace: 'require(/* dynamic import skipped */ (',
      },
    });

    // Add a fallback resolver for the problematic plugins
    config.resolve.alias = {
      ...config.resolve.alias,
      // Create empty modules for dynamic imports
      '/ROOT/node_modules/superagent/node_modules/formidable/src/plugins/': 
        require.resolve('next/dist/build/polyfills/polyfill-nomodule.js'),
      '/ROOT/node_modules/formidable/src/plugins/': 
        require.resolve('next/dist/build/polyfills/polyfill-nomodule.js')
    };

    return config;
  },
  // Configure image domains
  images: {
    domains: ['msg.lemonsquare.com.ph', '192.168.0.157'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
