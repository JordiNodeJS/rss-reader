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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
        <img 
          src="/empty-state.svg" 
          alt="No articles" 
          className="w-64 h-64 mb-6 opacity-80"
        />
        <h3 className="text-xl font-semibold mb-2 text-foreground">No articles found</h3>
        <p className="text-sm max-w-sm mx-auto">
          Add a feed to start reading the latest news from your favorite sources.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6 pb-20">
      {articles.map((article) => (
        <Card key={article.id || article.guid} className="flex flex-col h-full hover:shadow-lg transition-all duration-200 border-muted/60 overflow-hidden group">
          <div className="aspect-video w-full overflow-hidden bg-muted relative">
            <img
              src={article.image || "/article-placeholder.svg"}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = "/article-placeholder.svg";
              }}
            />
            {article.scrapedContent && (
              <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Saved</span>
              </div>
            )}
          </div>
          
          <CardHeader className="pb-2 pt-4">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </CardTitle>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {tryFormatDate(article.pubDate)}
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 text-sm text-muted-foreground">
            <p className="line-clamp-3 leading-relaxed">
              {article.contentSnippet || article.content?.replace(/<[^>]*>/g, '').slice(0, 150) + '...'}
            </p>
          </CardContent>
          
          <CardFooter className="pt-2 pb-4 flex justify-between gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onScrape(article.id!, article.link)}
              disabled={!!article.scrapedContent}
            >
              <Download className="w-4 h-4 mr-2" />
              {article.scrapedContent ? 'Saved' : 'Save'}
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 shadow-sm"
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
    return DateTime.fromISO(dateStr).toLocaleString(DateTime.DATETIME_MED) || 'Unknown date';
  } catch (e) {
    return 'Unknown date';
  }
}
