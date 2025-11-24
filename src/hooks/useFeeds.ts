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
        const errorMsg = data.details || data.error || "Failed to fetch feed";
        throw new Error(errorMsg);
      }

      // 2. Save feed to DB
      const newFeed: Omit<Feed, "id"> = {
        url,
        title: data.title || url,
        customTitle: customTitle || undefined,
        description: data.description,
        icon: data.image?.url,
        addedAt: Date.now(),
      };
      const feedId = await addFeed(newFeed);

      // 3. Save articles
      if (data.items) {
        for (const item of data.items) {
          await addArticle({
            feedId: Number(feedId),
            guid: item.guid || item.link || item.title,
            title: item.title,
            link: item.link,
            pubDate: item.pubDate || new Date().toISOString(),
            image: extractImage(item),
            content: item.content,
            contentSnippet: item.contentSnippet,
            isRead: false,
            isSaved: false,
            fetchedAt: Date.now(),
          });
        }
      }

      toast.success("Feed added successfully");
      await refreshFeeds();
      if (!selectedFeedId) await refreshArticles(); // Refresh all if viewing all
    } catch (error) {
      console.error(error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to add feed";
      toast.error(`Failed to add feed: ${errorMsg}`);
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
  // 1. Check enclosure (with or without type)
  if (item.enclosure?.url) {
    // If type exists, verify it's an image; if no type, assume it might be an image
    if (!item.enclosure.type || item.enclosure.type.startsWith("image/")) {
      return item.enclosure.url;
    }
  }

  // 2. Check media:content (various formats)
  const mediaContent = item["media:content"];
  if (mediaContent) {
    if (mediaContent.url) {
      return mediaContent.url;
    } else if (mediaContent["$"]?.url) {
      return mediaContent["$"].url;
    } else if (Array.isArray(mediaContent) && mediaContent[0]?.url) {
      return mediaContent[0].url;
    } else if (Array.isArray(mediaContent) && mediaContent[0]?.["$"]?.url) {
      return mediaContent[0]["$"].url;
    }
  }

  // 3. Check media:thumbnail
  const mediaThumbnail = item["media:thumbnail"];
  if (mediaThumbnail) {
    if (mediaThumbnail.url) {
      return mediaThumbnail.url;
    } else if (mediaThumbnail["$"]?.url) {
      return mediaThumbnail["$"].url;
    } else if (Array.isArray(mediaThumbnail) && mediaThumbnail[0]?.url) {
      return mediaThumbnail[0].url;
    }
  }

  // 4. Check itunes:image
  if (item["itunes:image"]?.href) {
    return item["itunes:image"].href;
  }

  // 5. Try to find first image in content:encoded (common in RSS 2.0)
  const contentEncoded = item["content:encoded"];
  if (contentEncoded) {
    const imgMatch = contentEncoded.match(/<img[^>]+src=["']([^"'>]+)["']/i);
    if (imgMatch) {
      return imgMatch[1];
    }
  }

  // 6. Try to find first image in content
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src=["']([^"'>]+)["']/i);
    if (imgMatch) {
      return imgMatch[1];
    }
  }

  // 7. Check for image in description
  if (item.description) {
    const imgMatch = item.description.match(/<img[^>]+src=["']([^"'>]+)["']/i);
    if (imgMatch) {
      return imgMatch[1];
    }
  }

  return undefined;
}
