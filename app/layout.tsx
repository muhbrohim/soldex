import type { Metadata } from 'next';
import Link from 'next/link';
import '../styles/globals.css';
import { CompareBar } from '@/components/CompareBar';

export const metadata: Metadata = {
  title: 'Soldex — Sole Index',
  description: 'A personal, data-first running-shoe database.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-line bg-panel/60 backdrop-blur sticky top-0 z-30">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6 text-sm">
            <Link href="/" className="font-semibold text-ink">
              Soldex<span className="text-muted font-normal"> · sole index</span>
            </Link>
            <div className="flex gap-4 text-muted">
              <Link href="/" className="hover:text-ink">Browse</Link>
              <Link href="/compare" className="hover:text-ink">Compare</Link>
              <Link href="/insights" className="hover:text-ink">Insights</Link>
              <Link href="/docs" className="hover:text-ink">Docs</Link>
              <Link href="/about" className="hover:text-ink">About</Link>
            </div>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <CompareBar />
        <footer className="border-t border-line mt-16 py-6 text-xs text-muted text-center">
          Soldex · personal data set · not a review site
        </footer>
      </body>
    </html>
  );
}
