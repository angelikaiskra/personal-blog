import type { Metadata } from 'next';
import { Outfit, Montserrat, Fira_Code } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

import { MotionProvider } from '@/components/providers/motion-provider';
import { siteConfig } from '@/config/site';

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
    default: siteConfig.name,
    template: `%s • ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author, url: new URL('/about', siteConfig.url).href }],
  creator: siteConfig.author,
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: [
      { url: '/favicon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/favicon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/favicon-mask.png', type: 'image/png', sizes: '512x512' }],
  },
  alternates: {
    types: { 'application/rss+xml': '/rss.xml' },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MotionProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script defer src="https://cloud.umami.is/script.js" data-website-id="2e128bcd-524e-4de2-abba-f4614f5c4202" />
        </head>
        <body className={`${outfit.variable} ${montserratMono.variable} ${firaCode.variable} antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </MotionProvider>
  );
}
