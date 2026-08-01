import type { Metadata } from 'next';
import { Outfit, Montserrat } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

const montserratMono = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Angela Iskra',
    template: '%s | Angela Iskra',
  },
  description: 'Blog about React, TypeScript and frontend development.',
  authors: [{ name: 'Angela Iskra' }],
  creator: 'Angela Iskra',
  metadataBase: new URL('https://angelaiskra.com'),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${montserratMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
