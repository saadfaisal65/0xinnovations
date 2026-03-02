/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development warnings
    reactStrictMode: true,

    // Optimize production builds
    compiler: {
        // Remove console.logs in production
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    },

    // Optimize images
    images: {
        formats: ['image/avif', 'image/webp'],
    },

    // Headers for performance
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                ],
            },
            {
                // Cache static assets aggressively
                source: '/(.*)\\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },

    // Experimental performance features
    experimental: {
        // Optimize package imports to only load what's used
        optimizePackageImports: ['lucide-react', 'framer-motion', 'ethers', 'date-fns'],
    },
};

module.exports = nextConfig;
