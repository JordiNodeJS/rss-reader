"use client";

import { useState, useEffect, useCallback } from "react";
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
  updateFeed,
} from "@/lib/db";
import { toast } from "sonner";

export function useFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);

  const refreshFeeds = useCallback(async () => {
    const loadedFeeds = await getAllFeeds();
    setFeeds(loadedFeeds);
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

  useEffect(() => {
    refreshFeeds();
  }, [refreshFeeds]);

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  const addNewFeed = async (url: string, customTitle?: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch feed data via proxy
      const res = await fetch(`/api/rss?url=${encodeURIComponent(url)}`);

      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Server returned an invalid response. Please try again."
        );
      }

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        throw new Error("Failed to parse server response");
      }

      if (!res.ok) {
        // Show more detailed error with suggestion if available
        const errorMsg = data.details || data.error || "Failed to fetch feed";
        const suggestion = data.suggestion || "";
        throw new Error(
          suggestion ? `${errorMsg}\n\n💡 ${suggestion}` : errorMsg
        );
      }

      // Validate we got items
      if (!data.items || data.items.length === 0) {
        toast.warning("Feed loaded but contains no articles yet");
      }

      // 2. Save feed to DB
      const feedTitle = customTitle || data.title || url;
      const newFeed: Omit<Feed, "id"> = {
        url,
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
      console.error(error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to add feed";
      toast.error(errorMsg, {
        duration: 6000, // Show longer for detailed errors
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFeed = async (id: number) => {
    await deleteFeed(id);
    toast.success("Feed removed");
    await refreshFeeds();
    if (selectedFeedId === id) setSelectedFeedId(null);
    await refreshArticles();
  };

  const updateFeedTitle = async (id: number, customTitle: string) => {
    try {
      await updateFeed(id, { customTitle: customTitle || undefined });
      toast.success("Feed title updated");
      await refreshFeeds();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update feed title");
    }
  };

  const scrapeArticle = async (articleId: number, url: string) => {
    try {
      toast.info("Scraping article...");
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
        throw new Error(
          "Server error: Unable to scrape article. The scraping service may be unavailable."
        );
      }

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Failed to parse server response");
      }

      if (!res.ok) {
        const errorMsg = data.details || data.error || "Failed to scrape";
        throw new Error(errorMsg);
      }

      if (data.content) {
        await updateArticleScrapedContent(articleId, data.content);
        // Update local state immediately
        setArticles((prev) =>
          prev.map((a) =>
            a.id === articleId ? { ...a, scrapedContent: data.content } : a
          )
        );
        toast.success("Article scraped and saved offline");
      } else {
        toast.warning("No content found to scrape");
      }
    } catch (error) {
      console.error(error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to scrape article";
      toast.error(`Failed to scrape article: ${errorMsg}`);
    }
  };

  const clearCache = async () => {
    try {
      const { clearAllData } = await import("@/lib/db");
      await clearAllData();
      setFeeds([]);
      setArticles([]);
      setSelectedFeedId(null);
      toast.success("Cache cleared successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear cache");
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
    clearCache,
  };
}

function extractImage(item: any): string | undefined {
  // Helper to validate image URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url || typeof url !== "string") return false;
    // Filter out tracking pixels and tiny images
    if (
      url.includes("pixel") ||
      url.includes("tracking") ||
      url.includes("beacon")
    )
      return false;
    // Must be a valid URL
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // 1. Check enclosure (with or without type)
  if (item.enclosure?.url) {
    if (!item.enclosure.type || item.enclosure.type.startsWith("image/")) {
      if (isValidImageUrl(item.enclosure.url)) return item.enclosure.url;
    }
  }

  // 2. Check media:content (various formats used by Spanish news sites)
  const mediaContent = item["media:content"];
  if (mediaContent) {
    const url =
      mediaContent.url ||
      mediaContent["$"]?.url ||
      (Array.isArray(mediaContent) &&
        (mediaContent[0]?.url || mediaContent[0]?.["$"]?.url));
    if (isValidImageUrl(url)) return url;
  }

  // 3. Check media:thumbnail (very common in eldiario.es, infolibre.es)
  const mediaThumbnail = item["media:thumbnail"];
  if (mediaThumbnail) {
    const url =
      mediaThumbnail.url ||
      mediaThumbnail["$"]?.url ||
      (Array.isArray(mediaThumbnail) &&
        (mediaThumbnail[0]?.url || mediaThumbnail[0]?.["$"]?.url));
    if (isValidImageUrl(url)) return url;
  }

  // 4. Check media:group > media:content (used by some feeds)
  const mediaGroup = item["media:group"];
  if (mediaGroup) {
    const groupContent = mediaGroup["media:content"];
    if (groupContent) {
      const url = groupContent.url || groupContent["$"]?.url;
      if (isValidImageUrl(url)) return url;
    }
  }

  // 5. Check itunes:image
  if (item["itunes:image"]?.href) {
    if (isValidImageUrl(item["itunes:image"].href))
      return item["itunes:image"].href;
  }

  // 6. Check direct image field (some feeds include this)
  if (item.image) {
    const imgUrl = typeof item.image === "string" ? item.image : item.image.url;
    if (isValidImageUrl(imgUrl)) return imgUrl;
  }

  // 7. Extract from content:encoded (common in RSS 2.0, WordPress feeds)
  const contentEncoded = item["content:encoded"];
  if (contentEncoded) {
    const imgUrl = extractFirstImageFromHtml(contentEncoded);
    if (imgUrl && isValidImageUrl(imgUrl)) return imgUrl;
  }

  // 8. Extract from content
  if (item.content) {
    const imgUrl = extractFirstImageFromHtml(item.content);
    if (imgUrl && isValidImageUrl(imgUrl)) return imgUrl;
  }

  // 9. Extract from summary
  if (item.summary) {
    const imgUrl = extractFirstImageFromHtml(item.summary);
    if (imgUrl && isValidImageUrl(imgUrl)) return imgUrl;
  }

  // 10. Extract from description
  if (item.description) {
    const imgUrl = extractFirstImageFromHtml(item.description);
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
function extractCategories(item: any): string[] | undefined {
  const categories: string[] = [];

  // 1. Check direct categories array (most common in RSS 2.0)
  if (item.categories && Array.isArray(item.categories)) {
    for (const cat of item.categories) {
      if (typeof cat === "string") {
        categories.push(cat);
      } else if (cat?._ || cat?.$?.term) {
        // Atom format: { _: "Category Name" } or { $: { term: "Category" } }
        categories.push(cat._ || cat.$.term);
      }
    }
  }

  // 2. Check single category field
  if (item.category) {
    if (typeof item.category === "string") {
      categories.push(item.category);
    } else if (Array.isArray(item.category)) {
      categories.push(
        ...item.category.filter((c: any) => typeof c === "string")
      );
    }
  }

  // 3. Check media:keywords (used by eldiario.es, etc.)
  if (item["media:keywords"]) {
    const keywords =
      typeof item["media:keywords"] === "string"
        ? item["media:keywords"]
        : item["media:keywords"]?._ || item["media:keywords"]?.$?.["#text"];
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
