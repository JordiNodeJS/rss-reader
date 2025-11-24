"use client";

import { Article } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface ArticleViewProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArticleView({ article, isOpen, onClose }: ArticleViewProps) {
  if (!article) return null;

  // Prefer scraped content, then full content, then snippet
  const contentToDisplay =
    article.scrapedContent ||
    article.content ||
    article.contentSnippet ||
    "No content available";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline">
              {new Date(article.pubDate).toLocaleDateString()}
            </Badge>
            {article.scrapedContent && (
              <Badge variant="secondary">Offline Ready</Badge>
            )}
          </div>
          <DialogTitle className="text-2xl font-bold leading-tight mb-3">
            {article.title}
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              Article content from{" "}
              {new Date(article.pubDate).toLocaleDateString()}
            </DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center gap-2">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              Visit Original <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-theme">
          <div
            className="prose prose-zinc dark:prose-invert max-w-none px-6 py-6 pr-8 break-words prose-img:max-h-[800px] prose-img:w-auto prose-img:object-contain prose-img:mx-auto"
            dangerouslySetInnerHTML={{ __html: contentToDisplay }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
