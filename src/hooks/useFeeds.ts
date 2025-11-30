"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Feed,
  Article,
  getAllFeeds,
  addFeed,
  deleteFeed,
  addArticle,
  getArticlesByFeed,
  getAllArticles,
  updateArticleScrapedContent,
  clearArticleScrapedContent,
  updateFeed,
  getFeedByUrl,
  updateFeedsOrder,
} from "@/lib/db";
import { toast } from "sonner";
import { logDBEvent } from "@/lib/db-monitor";
import { isValidImageUrl } from "@/lib/utils";
import { useActivityStatus } from "@/contexts/ActivityStatusContext";

// A user-facing error used to suppress noisy console.error logs for expected
// errors that are shown to the user (e.g., feed not found)
class UserError extends Error {}

// Helper that safely extracts a URL from a wide variety of RSS property shapes
// commonly found across different RSS/Atom feeds. Avoids using `any` so that
// linter rules for no-explicit-any are satisfied.
function extractUrlFromUnknown(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    // Try first element
    for (const el of val) {
      const u = extractUrlFromUnknown(el);
      if (u) return u;
    }
    return undefined;
  }
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url as string;
    if (typeof obj.href === "string") return obj.href as string;
    // Some libraries embed url under `$` or `#text` fields
    if (obj.$) {
      const url = extractUrlFromUnknown(obj.$);
      if (url) return url;
    }
    if (obj._) {
      const url = extractUrlFromUnknown(obj._);
      if (url) return url;
    }
  }
  return undefined;
}

// Safely retrieve nested string value from unknown objects without using `any`.
function getNestedString(
  obj: unknown,
  path: Array<string>
): string | undefined {
  let current: unknown = obj;
  for (const key of path) {
    if (
      current &&
      typeof current === "object" &&
      Object.prototype.hasOwnProperty.call(
        current as Record<string, unknown>,
        key
      )
    ) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? (current as string) : undefined;
}

export function useFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
  const { setActivity, clearActivity } = useActivityStatus();

  const refreshFeeds = useCallback(async () => {
    const loadedFeeds = await getAllFeeds();
    setFeeds(loadedFeeds);
  }, []);

  // Backup/restore key for localStorage
  const FEEDS_BACKUP_KEY = "rss-reader-feeds-backup";

  // Save a minimal feed backup to localStorage for resilience if IndexedDB
  // gets cleared for some reason (browser storage pressure or dev tooling).
  const saveFeedsBackupToLocalStorage = useCallback((allFeeds: Feed[]) => {
    try {
      const minimal = allFeeds.map((f) => ({
        url: f.url,
        title: f.title,
        customTitle: f.customTitle,
        description: f.description,
        icon: f.icon,
        addedAt: f.addedAt,
        order: f.order,
      }));
      localStorage.setItem(FEEDS_BACKUP_KEY, JSON.stringify(minimal));
    } catch (err) {
      // Ignore localStorage failures (e.g., privacy mode)
      console.warn("Failed to write feeds backup to localStorage", err);
    }
  }, []);

  const loadFeedsBackupFromLocalStorage = useCallback((): Array<
    Partial<Feed>
  > => {
    try {
      const raw = localStorage.getItem(FEEDS_BACKUP_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (err) {
      console.warn("Failed to read feeds backup from localStorage", err);
      return [];
    }
  }, []);

  const refreshArticles = useCallback(async () => {
    if (selectedFeedId) {
      const loadedArticles = await getArticlesByFeed(selectedFeedId);
      // Sort by date desc
      setArticles(
        loadedArticles.sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        )
      );
    } else {
      const allArticles = await getAllArticles();
      setArticles(
        allArticles.sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        )
      );
    }
  }, [selectedFeedId]);

  // Watch for unexpected emptying of feeds and log it for debugging
  const didManualClearRef = useRef(false);
  const prevFeedsCountRef = useRef<number>(0);
  useEffect(() => {
    const prev = prevFeedsCountRef.current;
    const curr = (feeds || []).length;
    if (prev > 0 && curr === 0 && !didManualClearRef.current) {
      try {
        logDBEvent({
          type: "deleted",
          name: "rss-reader-db",
          message:
            "IndexedDB feeds emptied unexpectedly (not by user clearCache)",
        });
      } catch (_e) {}
      console.warn("feeds became empty unexpectedly");
      // Restore backup attempt: already implemented elsewhere
    }
    prevFeedsCountRef.current = curr;
    // Reset manual clear flag after a short time
    if (didManualClearRef.current) {
      const t = setTimeout(() => (didManualClearRef.current = false), 1000);
      return () => clearTimeout(t);
    }
  }, [feeds]);

  useEffect(() => {
    (async () => {
      // Try to load from IndexedDB as usual
      await refreshFeeds();

      // If DB returned empty, try to restore from localStorage backup
      const current = await getAllFeeds();
      if ((current || []).length === 0) {
        const backup = loadFeedsBackupFromLocalStorage();
        if (backup.length > 0) {
          // Restore feeds (minimal info). We use addFeed directly to avoid
          // fetching RSS for every feed on restore; this keeps the UI
          // responsive. Articles will be re-fetched as the user interacts.
          try {
            for (const f of backup) {
              // It's possible a feed was previously removed; ignore errors
              await addFeed({
                url: f.url || "",
                title: f.title || f.url || "",
                customTitle: f.customTitle || undefined,
                description: f.description,
                icon: f.icon,
                addedAt: f.addedAt || Date.now(),
              });
            }
            const restored = await getAllFeeds();
            setFeeds(restored);
            try {
              logDBEvent({
                type: "created",
                name: "rss-reader-db",
                message: "Feeds restored from localStorage backup",
              });
            } catch (_) {}
            toast.success("Feeds restaurados desde copia de seguridad local");
          } catch (err) {
            console.warn("Failed to restore feeds from local backup", err);
          }
        }
      }
    })();
  }, [refreshFeeds, loadFeedsBackupFromLocalStorage]);

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  // Keep a local backup in localStorage in case IndexedDB is wiped.
  useEffect(() => {
    try {
      if (Array.isArray(feeds) && feeds.length > 0) {
        saveFeedsBackupToLocalStorage(feeds);
      }
    } catch (_e) {
      /* ignore */
    }
  }, [feeds, saveFeedsBackupToLocalStorage]);

  // Listen to localStorage changes across tabs and update state accordingly
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === FEEDS_BACKUP_KEY) {
        // If backup changed, we can attempt to re-sync to DB if needed
        // But avoid forced writes across tabs; simply re-run refresh.
        refreshFeeds();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshFeeds]);

  const addNewFeed = async (url: string, customTitle?: string) => {
    setIsLoading(true);
    setActivity("fetching-rss", `Fetching ${customTitle || url}`);
    try {
      // Fetch feed data via server-side proxy to avoid CORS issues.
      // External RSS feeds typically don't include CORS headers, so we
      // always use our /api/rss proxy which handles parsing server-side.
      const res = await fetch(`/api/rss?url=${encodeURIComponent(url)}`);

      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new UserError(
          "Server returned an invalid response. Please try again."
        );
      }

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Failed to parse server response:", parseError);
        throw new Error("Failed to parse server response");
      }

      if (!res.ok) {
        // Show more detailed error with suggestion if available
        const errorMsg = data.details || data.error || "Failed to fetch feed";
        const suggestion = data.suggestion || "";
        throw new UserError(
          suggestion ? `${errorMsg}\n\n💡 ${suggestion}` : errorMsg
        );
      }

      // Validate we got items
      if (!data.items || data.items.length === 0) {
        toast.warning("Feed cargado pero todavía no contiene artículos");
      }

      // 2. Check if feed already exists before saving
      setActivity("saving", "Saving feed to database");
      const feedTitle = customTitle || data.title || url;
      const storedFeedUrl = data._meta?.usedUrl || url;

      // Check for existing feed with same URL
      const existingFeed = await getFeedByUrl(storedFeedUrl);
      if (existingFeed) {
        toast.info(
          `Feed "${
            existingFeed.customTitle || existingFeed.title
          }" already exists`
        );
        setIsLoading(false);
        clearActivity();
        return;
      }

      const newFeed: Omit<Feed, "id"> = {
        url: storedFeedUrl,
        title: data.title || url,
        customTitle: customTitle || undefined,
        description: data.description,
        icon: data.image?.url,
        addedAt: Date.now(),
      };
      const feedId = await addFeed(newFeed);

      // 3. Save articles with better error handling per article
      let savedCount = 0;
      let errorCount = 0;
      if (data.items) {
        for (const item of data.items) {
          try {
            await addArticle({
              feedId: Number(feedId),
              feedTitle: feedTitle,
              guid: item.guid || item.link || item.title,
              title: item.title,
              link: item.link,
              pubDate: item.pubDate || new Date().toISOString(),
              image: extractImage(item),
              content: item.content,
              contentSnippet: item.contentSnippet,
              categories: extractCategories(item),
              isRead: false,
              isSaved: false,
              fetchedAt: Date.now(),
            });
            savedCount++;
          } catch (articleError) {
            errorCount++;
            console.warn(`Failed to save article: ${item.title}`, articleError);
          }
        }
      }

      // Show appropriate success message
      if (errorCount > 0) {
        toast.success(
          `Feed added with ${savedCount} articles (${errorCount} skipped)`
        );
      } else {
        toast.success(`Feed added successfully with ${savedCount} articles`);
      }

      await refreshFeeds();
      if (!selectedFeedId) await refreshArticles(); // Refresh all if viewing all
    } catch (error) {
      // Avoid logging user-facing errors as console.error to avoid a noisy
      // developer console for expected user input errors. Log them as warn.
      if (error instanceof UserError) {
        console.warn(error.message);
      } else {
        console.error(error);
      }
      // If we hit a low-level network error in the browser, the runtime will
      // often throw a TypeError with the message 'Failed to fetch'. Convert
      // that into a helpful message for the user that suggests common causes
      // (CORS, unreachable URL, offline network).
      let errorMsg: string;
      if (
        error instanceof TypeError &&
        (error.message === "Failed to fetch" ||
          /NetworkError/i.test(error.message))
      ) {
        errorMsg =
          "Network error contacting feed URL (possible CORS, DNS, or network issue). If the feed is remote, try again or add via the server proxy.";
      } else {
        errorMsg =
          error instanceof Error ? error.message : "Failed to add feed";
      }
      toast.error(errorMsg, {
        duration: 6000, // Show longer for detailed errors
      });
      setActivity("error", errorMsg);
      // Clear error status after a delay
      setTimeout(() => clearActivity(), 3000);
      return; // Exit early on error
    } finally {
      setIsLoading(false);
    }
    clearActivity();
  };

  const removeFeed = async (id: number) => {
    await deleteFeed(id);
    toast.success("Feed eliminado");
    await refreshFeeds();
    if (selectedFeedId === id) setSelectedFeedId(null);
    await refreshArticles();
  };

  const updateFeedTitle = async (id: number, customTitle: string) => {
    try {
      await updateFeed(id, { customTitle: customTitle || undefined });
      toast.success("Título del feed actualizado");
      await refreshFeeds();
    } catch (error) {
      if (error instanceof UserError) {
        console.warn(error.message);
      } else {
        console.error(error);
      }
      toast.error("Error al actualizar el título del feed");
    }
  };

  const scrapeArticle = async (
    articleId: number,
    url: string,
    withTranslation: boolean = false
  ) => {
    setActivity("scraping", "Scraping article content");
    try {
      toast.info(
        withTranslation
          ? "Scraping and translating article..."
          : "Scraping article..."
      );
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);

      // Check content type
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // If not JSON, get text for debugging
        const text = await res.text();
        console.error("Non-JSON response:", {
          status: res.status,
          contentType,
          snippet: text.slice(0, 500),
        });
        throw new UserError(
          "Server error: Unable to scrape article. The scraping service may be unavailable."
        );
      }

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Treat parsing as developer-level error, preserve console.error
        throw new Error("Failed to parse server response");
      }

      if (!res.ok) {
        const errorMsg = data.details || data.error || "Failed to scrape";
        throw new UserError(errorMsg);
      }

      if (data.content) {
        setActivity("saving", "Saving article offline");
        await updateArticleScrapedContent(articleId, data.content);

        // If translation is requested, translate the content
        if (withTranslation) {
          setActivity("translating", "Translating article to Spanish...");
          toast.info("Traduciendo artículo al español...");

          try {
            // Import translation functions dynamically
            const { translateToSpanish, translateHtmlPreservingFormat } =
              await import("@/lib/translation");
            const { updateArticleTranslation, getArticleById } = await import(
              "@/lib/db"
            );

            // Get the article to translate the title too
            const article = await getArticleById(articleId);
            if (!article) throw new Error("Article not found");

            // Translate title
            const titleResult = await translateToSpanish({
              text: article.title,
              skipLanguageDetection: true,
            });

            // Translate scraped content preserving HTML formatting (bold, italic, links, etc.)
            const contentResult = await translateHtmlPreservingFormat(
              data.content
            );

            // Save translation to database
            await updateArticleTranslation(
              articleId,
              titleResult.translatedText,
              contentResult.translatedText,
              "es",
              "en"
            );

            // Update local state with both scraped content and translation
            setArticles((prev) =>
              (prev || []).map((a) =>
                a.id === articleId
                  ? {
                      ...a,
                      scrapedContent: data.content,
                      translatedTitle: titleResult.translatedText,
                      translatedContent: contentResult.translatedText,
                      translationLanguage: "es",
                      originalLanguage: "en",
                      translatedAt: Date.now(),
                    }
                  : a
              )
            );

            toast.success("Artículo guardado y traducido al español");
          } catch (translationError) {
            console.error("Translation failed:", translationError);
            // Still save the scraped content even if translation fails
            setArticles((prev) =>
              (prev || []).map((a) =>
                a.id === articleId ? { ...a, scrapedContent: data.content } : a
              )
            );
            toast.warning(
              "Artículo guardado, pero la traducción falló. Puedes traducirlo más tarde."
            );
          }
        } else {
          // Update local state immediately (no translation)
          setArticles((prev) =>
            (prev || []).map((a) =>
              a.id === articleId ? { ...a, scrapedContent: data.content } : a
            )
          );
          toast.success("Artículo guardado para lectura sin conexión");
        }
        clearActivity();
      } else {
        toast.warning("No se encontró contenido para extraer");
        clearActivity();
      }
    } catch (error) {
      if (error instanceof UserError) {
        console.warn(error.message);
      } else {
        console.error(error);
      }
      const errorMsg =
        error instanceof Error ? error.message : "Failed to scrape article";
      toast.error(`Failed to scrape article: ${errorMsg}`);
      setActivity("error", errorMsg);
      setTimeout(() => clearActivity(), 3000);
    }
  };

  const unsaveArticle = async (articleId: number) => {
    setActivity("saving", "Removing saved article...");
    try {
      await clearArticleScrapedContent(articleId);
      // Update local state immediately
      setArticles((prev) =>
        (prev || []).map((a) =>
          a.id === articleId
            ? {
                ...a,
                scrapedContent: undefined,
                translatedTitle: undefined,
                translatedContent: undefined,
                translationLanguage: undefined,
                translatedAt: undefined,
                summary: undefined,
                summaryType: undefined,
                summaryLength: undefined,
              }
            : a
        )
      );
      toast.success("Artículo eliminado de guardados");
      clearActivity();
    } catch (error) {
      if (error instanceof UserError) {
        console.warn(error.message);
      } else {
        console.error(error);
      }
      const errorMsg =
        error instanceof Error ? error.message : "Failed to unsave article";
      toast.error(`Failed to unsave article: ${errorMsg}`);
      setActivity("error", errorMsg);
      setTimeout(() => clearActivity(), 3000);
    }
  };

  const clearCache = async () => {
    try {
      const { clearAllData } = await import("@/lib/db");
      // Mark manual clear to avoid false-positive logging
      didManualClearRef.current = true;
      await clearAllData();
      setFeeds([]);
      setArticles([]);
      setSelectedFeedId(null);
      try {
        // Log the user-triggered DB clear in our monitoring log
        logDBEvent({
          type: "deleted",
          name: "rss-reader-db",
          message: "clearCache() invoked by user",
        });
      } catch (_) {}
      try {
        localStorage.removeItem(FEEDS_BACKUP_KEY);
      } catch {
        /* ignore */
      }
      toast.success("Caché limpiada correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al limpiar la caché");
    }
  };

  const reorderFeeds = async (newFeeds: Feed[]) => {
    setFeeds(newFeeds);
    try {
      await updateFeedsOrder(newFeeds);
    } catch (error) {
      console.error("Failed to save feed order:", error);
      toast.error("Error al guardar el orden de los feeds");
      // Revert on error? Or just let it be... reloading will fix it or it will be out of sync until refresh
      // Ideally we should revert, but for now let's keep it simple
      refreshFeeds();
    }
  };

  return {
    feeds,
    articles,
    isLoading,
    addNewFeed,
    removeFeed,
    updateFeedTitle,
    selectedFeedId,
    setSelectedFeedId,
    scrapeArticle,
    unsaveArticle,
    clearCache,
    reorderFeeds,
  };
}

interface RSSItemLike {
  enclosure?: { url?: string; type?: string };
  [key: string]: unknown;
}

function extractImage(item: RSSItemLike): string | undefined {
  // We use the shared isValidImageUrl util from src/lib/utils.ts

  // 1. Check enclosure (with or without type)
  if (item.enclosure?.url) {
    if (!item.enclosure.type || item.enclosure.type.startsWith("image/")) {
      if (isValidImageUrl(item.enclosure.url)) return item.enclosure.url;
    }
  }

  // 2. Check media:content (various formats used by Spanish news sites)
  const mediaContent = item["media:content"] as unknown;
  if (mediaContent) {
    const url = extractUrlFromUnknown(mediaContent);
    if (isValidImageUrl(url)) return url;
  }

  // 3. Check media:thumbnail (very common in eldiario.es, infolibre.es)
  const mediaThumbnail = item["media:thumbnail"] as unknown;
  if (mediaThumbnail) {
    const url = extractUrlFromUnknown(mediaThumbnail);
    if (isValidImageUrl(url)) return url;
  }

  // 4. Check media:group > media:content (used by some feeds)
  const mediaGroup = item["media:group"] as unknown;
  if (mediaGroup) {
    const groupContent = (mediaGroup as Record<string, unknown>)[
      "media:content"
    ];
    if (groupContent) {
      const url = extractUrlFromUnknown(groupContent);
      if (isValidImageUrl(url)) return url;
    }
  }

  // 5. Check itunes:image
  const itunesImage = item["itunes:image"] as unknown;
  const itunesUrl = extractUrlFromUnknown(itunesImage);
  if (itunesUrl && isValidImageUrl(itunesUrl)) return itunesUrl;

  // 6. Check direct image field (some feeds include this)
  if (item.image) {
    const image = item.image as unknown;
    const imgUrl = extractUrlFromUnknown(image);
    if (isValidImageUrl(imgUrl)) return imgUrl;
  }

  // 7. Extract from content:encoded (common in RSS 2.0, WordPress feeds)
  const contentEncoded = item["content:encoded"] as unknown;
  if (contentEncoded) {
    const htmlStr =
      typeof contentEncoded === "string"
        ? contentEncoded
        : getNestedString(contentEncoded, ["_"]) ||
          getNestedString(contentEncoded, ["$", "#text"]) ||
          "";
    const imgUrl = extractFirstImageFromHtml(htmlStr);
    if (imgUrl && isValidImageUrl(imgUrl)) return imgUrl;
  }

  // 8. Extract from content
  if (item.content) {
    const contentVal = item.content as unknown;
    const htmlStr =
      typeof contentVal === "string"
        ? contentVal
        : getNestedString(contentVal, ["_"]) ||
          getNestedString(contentVal, ["$", "#text"]) ||
          "";
    const imgUrl = extractFirstImageFromHtml(htmlStr);
    if (imgUrl && isValidImageUrl(imgUrl)) return imgUrl;
  }

  // 9. Extract from summary
  if (item.summary) {
    const summaryVal = item.summary as unknown;
    const htmlStr =
      typeof summaryVal === "string"
        ? summaryVal
        : getNestedString(summaryVal, ["_"]) ||
          getNestedString(summaryVal, ["$", "#text"]) ||
          "";
    const imgUrl = extractFirstImageFromHtml(htmlStr);
    if (imgUrl && isValidImageUrl(imgUrl)) return imgUrl;
  }

  // 10. Extract from description
  if (item.description) {
    const descVal = item.description as unknown;
    const htmlStr =
      typeof descVal === "string"
        ? descVal
        : getNestedString(descVal, ["_"]) ||
          getNestedString(descVal, ["$", "#text"]) ||
          "";
    const imgUrl = extractFirstImageFromHtml(htmlStr);
    if (imgUrl && isValidImageUrl(imgUrl)) return imgUrl;
  }

  return undefined;
}

// Helper to extract first meaningful image from HTML content
function extractFirstImageFromHtml(html: string): string | undefined {
  if (!html) return undefined;

  // Try multiple patterns for robustness
  const patterns = [
    // Standard img src with quotes
    /<img[^>]+src=["']([^"']+)["']/i,
    // img src without quotes
    /<img[^>]+src=([^\s>]+)/i,
    // og:image meta tag (if embedded)
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    // figure with img
    /<figure[^>]*>\s*<img[^>]+src=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      // Skip tiny images (likely icons or tracking pixels)
      const url = match[1];
      if (
        !url.includes("1x1") &&
        !url.includes("spacer") &&
        !url.includes("blank.gif")
      ) {
        return url;
      }
    }
  }

  return undefined;
}

// Extract categories from RSS item
interface RSSItemLikeWithCategories extends RSSItemLike {
  categories?: unknown[];
  category?: unknown | unknown[];
  "media:keywords"?: unknown;
}

function extractCategories(
  item: RSSItemLikeWithCategories
): string[] | undefined {
  const categories: string[] = [];

  // 1. Check direct categories array (most common in RSS 2.0)
  if (item.categories && Array.isArray(item.categories)) {
    for (const cat of item.categories) {
      if (typeof cat === "string") {
        categories.push(cat);
      } else {
        // Atom format: { _: "Category Name" } or { $: { term: "Category" } }
        const acat = cat as unknown as Record<string, unknown>;
        const term = acat._ as string | undefined;
        const $term = (acat.$ as Record<string, unknown> | undefined)?.term as
          | string
          | undefined;
        const catVal = term ?? $term;
        if (catVal) categories.push(catVal);
      }
    }
  }

  // 2. Check single category field
  if (item.category) {
    if (typeof item.category === "string") {
      categories.push(item.category);
    } else if (Array.isArray(item.category)) {
      categories.push(
        ...(item.category.filter(
          (c: unknown) => typeof c === "string"
        ) as string[])
      );
    }
  }

  // 3. Check media:keywords (used by eldiario.es, etc.)
  if (item["media:keywords"]) {
    const mediaKeywords = item["media:keywords"] as unknown;
    const keywords =
      typeof mediaKeywords === "string"
        ? mediaKeywords
        : getNestedString(mediaKeywords, ["_"]) ||
          getNestedString(mediaKeywords, ["$", "#text"]);
    if (keywords) {
      // Keywords are usually comma-separated
      const keywordArray = keywords
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean);
      categories.push(...keywordArray);
    }
  }

  // 4. Deduplicate and limit to most relevant (first 5)
  const uniqueCategories = [...new Set(categories)].slice(0, 5);

  return uniqueCategories.length > 0 ? uniqueCategories : undefined;
}
