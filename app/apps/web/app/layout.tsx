import type { Metadata } from 'next';
// Must come from the /ssr subpackage in Next.js — the plain React build renders
// nothing on the server and produces a hydration mismatch.
import { PorscheDesignSystemProvider } from '@porsche-design-system/components-react/ssr';
import './globals.css';

export const metadata: Metadata = {
  title: 'PDS Tetris',
  description: 'A modern Tetris built on the Porsche Design System.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      {/* "scheme-light-dark" follows the OS/browser color-scheme preference,
          matching the `color-scheme: light dark` + light-dark() setup in globals.css. */}
      <body className="scheme-light-dark">
        <PorscheDesignSystemProvider>{children}</PorscheDesignSystemProvider>
      </body>
    </html>
  );
}
