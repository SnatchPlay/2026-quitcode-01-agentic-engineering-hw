import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @tetris/engine and @tetris/contracts are workspace packages that ship raw
  // TypeScript (no build step of their own) — Next has to transpile them itself.
  transpilePackages: ['@tetris/engine', '@tetris/contracts', '@porsche-design-system/components-react'],
  reactStrictMode: true,
};

export default nextConfig;
