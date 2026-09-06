/**
 * Single import point for Porsche Design System components in this app.
 *
 * Everything comes from the `/ssr` subpackage — not just the Provider. PDS v4's
 * SSR build renders framework-appropriate markup for web components during
 * Next.js's server render (deviating from normal SSR/SSG markup-parity rules on
 * purpose, per PDS's own docs) and hands off to the client build after
 * hydration; importing individual components from the plain (non-SSR) package
 * inside a Next.js app risks a hydration mismatch, since that build assumes a
 * browser is present from the first render.
 */
export * from '@porsche-design-system/components-react/ssr';
