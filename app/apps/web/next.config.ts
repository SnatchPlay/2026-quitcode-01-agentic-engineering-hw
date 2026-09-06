import type { NextConfig } from 'next';

// GitHub Pages only serves static files (no Node server), so a Pages deploy
// needs `output: 'export'` plus a `basePath`/`assetPrefix` for the repo's
// project-page subpath (https://<user>.github.io/<repo>/). That's gated behind
// GITHUB_PAGES=true rather than being the default, so the homework's own
// `npm run dev` / `npm run build` (graded as-is) keep behaving exactly as
// before — this repo has no server-only features (no route handlers, server
// actions, cookies()/headers(), or next/image), so static export is safe here.
const isGithubPagesBuild = process.env.GITHUB_PAGES === 'true';
const repoBasePath = '/2026-quitcode-01-agentic-engineering-hw';

const nextConfig: NextConfig = {
  // @tetris/engine and @tetris/contracts are workspace packages that ship raw
  // TypeScript (no build step of their own) — Next has to transpile them itself.
  transpilePackages: ['@tetris/engine', '@tetris/contracts', '@porsche-design-system/components-react'],
  reactStrictMode: true,
  ...(isGithubPagesBuild
    ? {
        output: 'export',
        basePath: repoBasePath,
        assetPrefix: repoBasePath,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
