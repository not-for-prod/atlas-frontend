import { resolve } from 'node:path';
import { type NextConfig } from 'next';
const config: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.ATLAS_TEST_MODE === '1' ? '.next/verification' : '.next',
  devIndicators: false,
  logging: { incomingRequests: { ignore: [/^\/auth\/callback\//] } },
  async headers() {
    return [
      {
        source: '/auth/callback/:provider',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
  webpack(config, { dev, webpack }) {
    if (!dev) {
      // Next's flight loader uses absolute client-module paths, bypassing TS aliases.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[/\\]src[/\\]preview[/\\]Preview(?:Dashboard|Gallery)\.tsx$/,
          resolve(process.cwd(), 'configs/disabled-preview.ts'),
        ),
      );
    }
    return config;
  },
};
export default config;
