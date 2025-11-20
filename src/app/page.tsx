"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ArticleList } from "@/components/articles/ArticleList";
import { ArticleView } from "@/components/articles/ArticleView";
import { useFeeds } from "@/hooks/useFeeds";
import { useState } from "react";
import { Article } from "@/lib/db";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  const feedState = useFeeds();
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);

  return (
    <>
      <AppShell feedState={feedState}>
        <div className="h-full overflow-y-auto bg-muted/5">
          <header className="p-6 pb-2 pl-16 md:pl-6">
            <h2 className="text-3xl font-bold tracking-tight">
              {feedState.selectedFeedId 
                ? feedState.feeds.find(f => f.id === feedState.selectedFeedId)?.title 
                : 'All Articles'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {feedState.articles.length} articles available
            </p>
          </header>
          
          <ArticleList 
            articles={feedState.articles}
            onScrape={feedState.scrapeArticle}
            onView={setViewingArticle}
          />
        </div>
      </AppShell>

      <ArticleView 
        article={viewingArticle}
        isOpen={!!viewingArticle}
        onClose={() => setViewingArticle(null)}
      />
      
      <Toaster />
    </>
  );
}
