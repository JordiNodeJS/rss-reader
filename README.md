# RSS Reader Antigravity

A modern, offline-capable RSS reader built with Next.js 16, React 19, and Tailwind CSS. Designed for speed, aesthetics, and a premium user experience.

📚 **[View Learning Report](docs/aprendizajes.md)** - Comprehensive analysis of technical architecture, implementation challenges, and key learnings from this project.

![Home Light](public/screenshots/home-populated-light.webp)

## Features

- **Offline Support**: Persists feeds and articles using IndexedDB for offline reading.
- **RSS Parsing**: Robust server-side parsing using `rss-parser`.
- **Web Scraping**: Hybrid scraper using Mozilla Readability (primary) with Cheerio fallback for robust article extraction from Spanish news sites.
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and Shadcn UI.
- **Dark Mode**: Fully supported dark mode with smooth transitions.
- **Image Optimization**: Automatic image processing and optimization.

## Screenshots

### Home Screen (Dark Mode)

![Home Dark](public/screenshots/home-populated-dark.webp)

### Reading Experience

![Article View](public/screenshots/article-view-light.webp)

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Frontend**: React 19, Tailwind CSS, Lucide Icons
- **State/Storage**: IndexedDB (via `idb`), Custom Hooks
- **Backend API**: Next.js API Routes
- **Scraping**: Mozilla Readability, JSDOM, Cheerio, Sanitize-HTML, Sharp
- **Utilities**: Luxon (Dates), Sonner (Toasts)

## Getting Started

1. **Install dependencies:**

```bash
pnpm install
# or
npm install
```

2. **Run the development server:**

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Key Technical Highlights

This project demonstrates advanced techniques in:

- **Hybrid Web Scraping**: Combines Mozilla Readability's intelligent article extraction with site-specific CSS selectors
- **Offline-First Architecture**: Full offline capability with IndexedDB persistence
- **Image Processing**: Automatic optimization and WebP conversion with Sharp
- **Modern React Patterns**: Custom hooks, TypeScript, and component composition

For detailed technical analysis and implementation insights, see our [Learning Report](docs/aprendizajes.md).

## License

MIT
