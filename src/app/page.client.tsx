"use client";

import { lazy, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ArticleList } from "@/components/articles/ArticleList";
import { Footer } from "@/components/Footer";
import { useFeeds } from "@/hooks/useFeeds";
import { useState, useMemo } from "react";
import { Article } from "@/lib/db";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy load ArticleView - it's a heavy component only needed when viewing an article
const ArticleView = lazy(() =>
  import("@/components/articles/ArticleView").then((mod) => ({
    default: mod.ArticleView,
  }))
);

// Loading fallback for ArticleView
function ArticleViewFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando artículo...</p>
      </div>
    </div>
  );
}

interface HomeClientProps {
  initialSidebarWidth?: number;
}

export default function HomeClient({ initialSidebarWidth }: HomeClientProps) {
  const feedState = useFeeds();
  const [viewingArticleId, setViewingArticleId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Derive viewingArticle from feedState.articles to keep it in sync with favorites
  const viewingArticle = useMemo(() => {
    if (!viewingArticleId || !feedState.articles) return null;
    return feedState.articles.find((a) => a.id === viewingArticleId) || null;
  }, [viewingArticleId, feedState.articles]);

  const handleViewArticle = (article: Article) => {
    setViewingArticleId(article.id ?? null);
  };

  const handleCloseArticle = () => {
    setViewingArticleId(null);
  };

  const filteredArticles = useMemo(() => {
    let result = [...(feedState.articles || [])];

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter((article) => article.isFavorite);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          (article.contentSnippet &&
            article.contentSnippet.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [feedState.articles, searchQuery, sortOrder, showFavoritesOnly]);

  return (
    <>
      <AppShell feedState={feedState} initialSidebarWidth={initialSidebarWidth}>
        <div id="app-scroll" className="h-full overflow-y-auto bg-muted/5">
          <header className="p-6 pb-2 pl-16 md:pl-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {showFavoritesOnly
                    ? "Artículos favoritos"
                    : feedState.selectedFeedId
                    ? feedState.feeds.find(
                        (f) => f.id === feedState.selectedFeedId
                      )?.title
                    : "Todos los artículos"}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {filteredArticles.length} artículos disponibles
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`gap-1.5 ${
                    showFavoritesOnly
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : ""
                  }`}
                  title={
                    showFavoritesOnly
                      ? "Mostrar todos"
                      : "Mostrar solo favoritos"
                  }
                >
                  <Heart
                    className={`w-4 h-4 ${
                      showFavoritesOnly ? "fill-current" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">Favoritos</span>
                </Button>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar artículos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={sortOrder}
                  onValueChange={(value: "newest" | "oldest") =>
                    setSortOrder(value)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent id="select-sort-order">
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="oldest">Más antiguos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </header>

          <ArticleList
            articles={filteredArticles}
            feeds={feedState.feeds}
            onScrape={feedState.scrapeArticle}
            onUnsave={feedState.unsaveArticle}
            onView={handleViewArticle}
            onToggleFavorite={feedState.toggleArticleFavorite}
          />
        </div>
      </AppShell>

      {/* Lazy load ArticleView only when needed */}
      {viewingArticle && (
        <Suspense fallback={<ArticleViewFallback />}>
          <ArticleView
            article={viewingArticle}
            isOpen={!!viewingArticle}
            onClose={handleCloseArticle}
            onToggleFavorite={feedState.toggleArticleFavorite}
          />
        </Suspense>
      )}

      <Footer />
      <Toaster />
    </>
  );
}
