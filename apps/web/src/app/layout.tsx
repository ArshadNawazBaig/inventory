import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ThemeScript } from '@/components/theme/theme-script';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockFlow',
  description: 'Modern Inventory Management SaaS',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
