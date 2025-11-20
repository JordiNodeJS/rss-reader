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

  const addNewFeed = async (url: string) => {
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

  return {
    feeds,
    articles,
    isLoading,
    addNewFeed,
    removeFeed,
    selectedFeedId,
    setSelectedFeedId,
    scrapeArticle,
  };
}
