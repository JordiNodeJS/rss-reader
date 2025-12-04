import HomeClient from "./page.client";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("sidebar-width");
  const width = cookie ? parseInt(cookie.value, 10) : undefined;
  const parsed = Number.isNaN(width) ? undefined : width;
  // Constrain between 240 and 600 to match client-side behavior
  const initialSidebarWidth = parsed
    ? Math.min(Math.max(parsed, 240), 600)
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "RSS Reader Antigravity",
    applicationCategory: "NewsApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "A modern, retro-arcade styled RSS reader with offline support, themes, and AI integration.",
    author: {
      "@type": "Person",
      name: "JordiNodeJS",
      url: "https://github.com/JordiNodeJS",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient initialSidebarWidth={initialSidebarWidth} />
    </>
  );
}
