import type { Metadata } from 'next';
import { Outfit, Montserrat, Fira_Code } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

import { MotionProvider } from '@/components/providers/motion-provider';

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

const firaCode = Fira_Code({
  variable: '--font-fira-code',
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
    <MotionProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${outfit.variable} ${montserratMono.variable} ${firaCode.variable} antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </MotionProvider>
  );
}
