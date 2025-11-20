"use client";

import { Article } from "@/lib/db";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, BookOpen, CheckCircle, Clock } from "lucide-react";
import { DateTime } from "luxon";

interface ArticleListProps {
  articles: Article[];
  onScrape: (id: number, url: string) => void;
  onView: (article: Article) => void;
}

export function ArticleList({ articles, onScrape, onView }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <div className="text-lg">No articles found</div>
        <p className="text-sm">Add a feed to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 pl-16 md:pl-4 pb-20">
      {articles.map((article) => (
        <Card key={article.id || article.guid} className="flex flex-col h-full hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
                {article.title}
              </CardTitle>
              {article.scrapedContent && (
                <Badge variant="secondary" className="shrink-0">
                  <CheckCircle className="w-3 h-3 mr-1" /> Saved
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {tryFormatDate(article.pubDate)}
            </div>
          </CardHeader>
          <CardContent className="flex-1 text-sm text-muted-foreground">
            <p className="line-clamp-3">
              {article.contentSnippet || article.content?.replace(/<[^>]*>/g, '').slice(0, 150) + '...'}
            </p>
          </CardContent>
          <CardFooter className="pt-2 flex justify-between gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onScrape(article.id!, article.link)}
              disabled={!!article.scrapedContent}
            >
              <Download className="w-4 h-4 mr-2" />
              {article.scrapedContent ? 'Saved' : 'Scrape'}
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => onView(article)}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Read
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function tryFormatDate(dateStr: string) {
  try {
    return DateTime.fromISO(dateStr).toRelative() || 'Unknown date';
  } catch (e) {
    return 'Unknown date';
  }
}
