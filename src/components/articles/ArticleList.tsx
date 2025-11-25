"use client";

import { Article } from "@/lib/db";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, BookOpen, CheckCircle, Clock, Newspaper, Tag } from "lucide-react";
import { DateTime } from "luxon";

// Map common category names to display colors
const CATEGORY_COLORS: Record<string, string> = {
  // Geographic/Regional
  'internacional': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  'españa': 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
  'américa': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'latinoamérica': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'europa': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  'mundo': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  
  // Topics
  'política': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  'economía': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'sociedad': 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
  'cultura': 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20',
  'deportes': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
  'tecnología': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
  'ciencia': 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
  'opinión': 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  'justicia': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  
  // Default
  'default': 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20',
};

function getCategoryColor(category: string): string {
  const normalizedCategory = category.toLowerCase().trim();
  return CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS['default'];
}

// Get the most relevant category to display (prioritize topics over names)
function getDisplayCategory(categories?: string[]): string | null {
  if (!categories || categories.length === 0) return null;
  
  // Priority categories (topics we want to highlight)
  const priorityKeywords = [
    'internacional', 'españa', 'política', 'economía', 'sociedad', 
    'cultura', 'deportes', 'tecnología', 'ciencia', 'opinión', 
    'justicia', 'américa', 'europa', 'mundo', 'latinoamérica'
  ];
  
  // Find the first matching priority category
  for (const keyword of priorityKeywords) {
    const found = categories.find(c => c.toLowerCase().includes(keyword));
    if (found) return found;
  }
  
  // Return first category if no priority match
  return categories[0];
}

import { Feed } from "@/lib/db";

interface ArticleListProps {
  articles: Article[];
  feeds: Feed[];
  onScrape: (id: number, url: string) => void;
  onView: (article: Article) => void;
}

// Helper to get feed title for an article
function getFeedTitle(article: Article, feeds: Feed[]): string | null {
  // First check if article has cached feedTitle
  if (article.feedTitle) return article.feedTitle;
  
  // Otherwise look up from feeds array
  const feed = feeds.find(f => f.id === article.feedId);
  if (feed) {
    return feed.customTitle || feed.title;
  }
  
  return null;
}

export function ArticleList({ articles, feeds, onScrape, onView }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
        <img
          src="/empty-state.svg"
          alt="No articles"
          className="w-64 h-64 mb-6 opacity-80"
        />
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          No articles found
        </h3>
        <p className="text-sm max-w-sm mx-auto">
          Add a feed to start reading the latest news from your favorite
          sources.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6 pb-20">
      {articles.map((article) => (
        <Card
          key={article.id || article.guid}
          className="flex flex-col h-full hover:shadow-lg transition-all duration-200 border-muted/60 overflow-hidden group"
        >
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
            {/* Source and Category Badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(() => {
                const feedTitle = getFeedTitle(article, feeds);
                if (feedTitle) {
                  return (
                    <Badge 
                      variant="outline" 
                      className="text-[10px] px-1.5 py-0 h-5 bg-primary/5 border-primary/20 text-primary font-medium"
                    >
                      <Newspaper className="w-3 h-3 mr-1" />
                      {feedTitle}
                    </Badge>
                  );
                }
                return null;
              })()}
              {(() => {
                const displayCategory = getDisplayCategory(article.categories);
                if (displayCategory) {
                  return (
                    <Badge 
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-5 font-medium border ${getCategoryColor(displayCategory)}`}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {displayCategory}
                    </Badge>
                  );
                }
                return null;
              })()}
            </div>
            
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
              {article.contentSnippet ||
                article.content?.replace(/<[^>]*>/g, "").slice(0, 150) + "..."}
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
              {article.scrapedContent ? "Saved" : "Save"}
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
  if (!dateStr) return "Unknown date";

  try {
    // Try ISO format first (e.g., "2024-12-10T12:30:00Z")
    let dt = DateTime.fromISO(dateStr);
    if (dt.isValid) {
      return dt.toLocaleString(DateTime.DATETIME_MED);
    }

    // Try RFC 2822 format (common in RSS feeds, e.g., "Tue, 10 Dec 2024 12:30:00 GMT")
    dt = DateTime.fromRFC2822(dateStr);
    if (dt.isValid) {
      return dt.toLocaleString(DateTime.DATETIME_MED);
    }

    // Try HTTP format (e.g., "Tue, 10 Dec 2024 12:30:00 GMT")
    dt = DateTime.fromHTTP(dateStr);
    if (dt.isValid) {
      return dt.toLocaleString(DateTime.DATETIME_MED);
    }

    // Try JavaScript Date parsing as fallback
    const jsDate = new Date(dateStr);
    if (!isNaN(jsDate.getTime())) {
      dt = DateTime.fromJSDate(jsDate);
      if (dt.isValid) {
        return dt.toLocaleString(DateTime.DATETIME_MED);
      }
    }

    return "Unknown date";
  } catch {
    return "Unknown date";
  }
}
