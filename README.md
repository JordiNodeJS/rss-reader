# RSS Reader Antigravity

A modern, offline-capable RSS reader built with Next.js 16, React 19, and Tailwind CSS. Designed for speed, aesthetics, and a premium user experience.

![Home Light](public/screenshots/home-populated-light.webp)

## Features

- **Offline Support**: Persists feeds and articles using IndexedDB for offline reading.
- **RSS Parsing**: Robust server-side parsing using `rss-parser`.
- **Web Scraping**: Integrated Playwright scraper to fetch full article content when RSS feeds are truncated.
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
- **Scraping**: Playwright, Cheerio, Sanitize-HTML
- **Utilities**: Luxon (Dates), Sonner (Toasts)

## Getting Started

1. **Install dependencies:**

```bash
pnpm install
# or
npm install
```

2. **Install Playwright browsers (required for scraping):**

```bash
npx playwright install chromium
```

3. **Run the development server:**

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

MIT
