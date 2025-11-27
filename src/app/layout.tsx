import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeInitializer } from "@/components/theme-initializer";
import { ActivityStatusProvider } from "@/contexts/ActivityStatusContext";

// Las fuentes se cargan dinámicamente según el tema seleccionado
// Ver el script themeScript que precarga las fuentes de Google Fonts

export const metadata: Metadata = {
  title: {
    default: "RSS Reader - Modern & Retro Style",
    template: "%s | RSS Reader",
  },
  description:
    "A modern, retro-arcade styled RSS reader with offline support, themes, and AI integration.",
  applicationName: "RSS Reader",
  authors: [{ name: "JordiNodeJS" }],
  keywords: [
    "RSS",
    "Reader",
    "Feed",
    "News",
    "Offline",
    "PWA",
    "Next.js",
    "React",
    "Retro",
    "Arcade",
  ],
  creator: "JordiNodeJS",
  publisher: "JordiNodeJS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "RSS Reader - Modern & Retro Style",
    description:
      "A modern, retro-arcade styled RSS reader with offline support.",
    url: "https://rss-reader-antigravity.vercel.app",
    siteName: "RSS Reader",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RSS Reader - Modern & Retro Style",
    description:
      "A modern, retro-arcade styled RSS reader with offline support.",
    creator: "@JordiNodeJS",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Script que se ejecuta antes de React para aplicar el tema y evitar flash/hydration mismatch
  // También precarga el CSS del tema y las fuentes para evitar FOUC (Flash of Unstyled Content)
  const themeScript = `
    (function() {
      // Mapa de fuentes de Google Fonts por tema
      var themeFonts = {
        "amber-minimal": ["Inter"],
        "amethyst-haze": ["Geist"],
        "bold-tech": ["Roboto", "Playfair Display", "Fira Code"],
        "bubblegum": ["Poppins", "Playfair Display", "Fira Code"],
        "candyland": ["Poppins", "Lora", "Fira Code"],
        "catppuccin": ["Montserrat", "Merriweather", "JetBrains Mono"],
        "claude": [],
        "claymorphism": ["Plus Jakarta Sans", "DM Sans", "JetBrains Mono"],
        "clean-slate": ["Inter", "Source Serif 4", "JetBrains Mono"],
        "cosmic-night": ["Oxanium", "Source Code Pro"],
        "cyberpunk": ["Oxanium", "Source Code Pro"],
        "darkmatter": ["Inter", "JetBrains Mono"],
        "doom-64": ["Oxanium", "Source Code Pro"],
        "elegant-luxury": ["Libre Baskerville", "Lora", "Source Code Pro"],
        "graphite": ["Inter", "JetBrains Mono"],
        "kodama-grove": ["Quicksand", "Merriweather", "Fira Code"],
        "midnight-bloom": ["Poppins", "Playfair Display", "Fira Code"],
        "mocha-mousse": ["Outfit", "Space Mono"],
        "modern-minimal": ["Inter", "Source Serif 4", "JetBrains Mono"],
        "mono": ["Geist Mono"],
        "nature": ["Open Sans", "Merriweather", "Fira Code"],
        "neo-brutalism": ["Inter", "JetBrains Mono"],
        "northern-lights": ["Inter", "Source Serif 4", "Fira Code"],
        "notebook": ["Architects Daughter"],
        "ocean-breeze": ["Poppins", "Playfair Display", "Fira Code"],
        "pastel-dreams": ["Poppins", "Lora", "Fira Code"],
        "perpetuity": ["Antic", "IBM Plex Mono"],
        "quantum-rose": ["Poppins", "Playfair Display", "Fira Code"],
        "retro-arcade": ["Outfit", "Space Mono"],
        "sage-garden": ["Outfit", "Space Mono"],
        "soft-pop": ["DM Sans", "Fira Code"],
        "solar-dusk": ["Inter", "Source Serif 4", "Fira Code"],
        "starry-night": ["Poppins", "Lora", "Fira Code"],
        "sunset-horizon": ["Poppins", "Playfair Display", "Fira Code"],
        "supabase": ["Inter", "JetBrains Mono"],
        "t3-chat": ["Geist", "Geist Mono"],
        "tangerine": ["Outfit", "Space Mono"],
        "twitter": ["Inter", "JetBrains Mono"],
        "vercel": ["Geist", "Geist Mono"],
        "vintage-paper": ["Libre Baskerville", "Lora", "Source Code Pro"],
        "violet-bloom": ["Poppins", "Playfair Display", "Fira Code"]
      };
      
      function loadFonts(fonts) {
        if (!Array.isArray(fonts) || fonts.length === 0) return;
        var families = (fonts || []).map(function(f) {
          return "family=" + f.replace(/ /g, "+") + ":wght@400;500;600;700";
        }).join("&");
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?" + families + "&display=swap";
        document.head.appendChild(link);
      }
      
      try {
        var theme = 'claude';
        var stored = localStorage.getItem('rss-reader-theme-config');
        if (stored) {
          var parsed = JSON.parse(stored);
          theme = parsed.state?.currentTheme || 'claude';
        }
        document.documentElement.classList.add('theme-' + theme);
        
        // Precargar las fuentes del tema
        loadFonts(themeFonts[theme]);
        
        // Precargar el CSS del tema para evitar flash
        var link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = '/styles/themes/' + theme + '.css';
        link.id = 'dynamic-theme-link';
        link.onload = function() {
          this.onload = null;
          this.rel = 'stylesheet';
        };
        document.head.appendChild(link);
        // Fallback: convert to stylesheet immediately for browsers that don't support onload
        setTimeout(function() {
          if (link.rel !== 'stylesheet') {
            link.rel = 'stylesheet';
          }
        }, 0);
      } catch (e) {
        document.documentElement.classList.add('theme-claude');
        loadFonts(themeFonts['claude']);
        var link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = '/styles/themes/claude.css';
        link.id = 'dynamic-theme-link';
        link.onload = function() {
          this.onload = null;
          this.rel = 'stylesheet';
        };
        document.head.appendChild(link);
        setTimeout(function() {
          if (link.rel !== 'stylesheet') {
            link.rel = 'stylesheet';
          }
        }, 0);
      }
    })()
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased font-sans">
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
