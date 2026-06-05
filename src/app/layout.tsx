import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Angela Iskra",
    template: "%s | Angela Iskra",
  },
  description:
    "Blog about React, TypeScript and frontend development.",
  authors: [{ name: "Angela Iskra" }],
  creator: "Angela Iskra",
  metadataBase: new URL("https://angelaiskra.com"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
