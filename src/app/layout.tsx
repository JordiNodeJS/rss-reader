import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeInitializer } from "@/components/theme-initializer";
import { ActivityStatusProvider } from "@/contexts/ActivityStatusContext";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RSS Reader",
  description: "A modern, retro-arcade styled RSS reader",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Script que se ejecuta antes de React para aplicar el tema y evitar flash/hydration mismatch
  const themeScript = `
    (function() {
      try {
        const stored = localStorage.getItem('rss-reader-theme-config');
        if (stored) {
          const parsed = JSON.parse(stored);
          const theme = parsed.state?.currentTheme || 'retro-arcade';
          document.documentElement.classList.add('theme-' + theme);
        } else {
          document.documentElement.classList.add('theme-retro-arcade');
        }
      } catch (e) {
        document.documentElement.classList.add('theme-retro-arcade');
      }
    })()
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${outfit.variable} ${spaceMono.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeInitializer>
            <ActivityStatusProvider>{children}</ActivityStatusProvider>
          </ThemeInitializer>
        </ThemeProvider>
      </body>
    </html>
  );
}
