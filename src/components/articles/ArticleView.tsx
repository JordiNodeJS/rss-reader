"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Article } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
  GripVertical,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface ArticleViewProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

interface IframeViewerProps {
  url: string;
  onClose: () => void;
}

function IframeViewer({ url, onClose }: IframeViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [size, setSize] = useState({ width: 900, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">(
    "loading"
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isFullscreen) return;
      e.preventDefault();
      setIsResizing(true);
      startPos.current = { x: e.clientX, y: e.clientY };
      startSize.current = { ...size };
    },
    [size, isFullscreen]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      setSize({
        width: Math.max(
          400,
          Math.min(window.innerWidth - 40, startSize.current.width + deltaX)
        ),
        height: Math.max(
          300,
          Math.min(window.innerHeight - 40, startSize.current.height + deltaY)
        ),
      });
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={containerRef}
        className={`relative bg-background border rounded-lg shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen ? "!w-screen !h-screen !rounded-none" : ""
        }`}
        style={
          isFullscreen
            ? { width: "100vw", height: "100vh" }
            : { width: size.width, height: size.height }
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-medium truncate text-muted-foreground">
              {url}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(url, "_blank")}
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Iframe */}
        <div className="flex-1 min-h-0 relative">
          {/* Loading state */}
          {loadState === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Loading article...</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {loadState === "error" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-4 text-center p-6 max-w-md">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Cannot load this page
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This website doesn&apos;t allow embedding in iframes for
                    security reasons. This is a common restriction on many
                    websites.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={() => window.open(url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in new tab
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={url}
            className={`w-full h-full border-0 ${
              loadState !== "loaded" ? "invisible" : ""
            }`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox allow-downloads allow-modals"
            title="Article content"
            onLoad={() => {
              // For cross-origin iframes, we can't reliably detect if they loaded correctly
              // Many sites block iframes with X-Frame-Options or CSP
              // We'll check if we can access the iframe content
              const iframe = iframeRef.current;
              if (!iframe) return;

              try {
                // Try to access iframe location - will throw for blocked pages
                const iframeWindow = iframe.contentWindow;
                if (iframeWindow) {
                  // If we can access the href and it's about:blank or chrome-error, it failed
                  try {
                    const href = iframeWindow.location.href;
                    if (
                      href === "about:blank" ||
                      href.includes("chrome-error")
                    ) {
                      setLoadState("error");
                      return;
                    }
                  } catch {
                    // Cross-origin - can't access location, which is actually good
                    // It means the page loaded (even if we can't interact with it)
                    setLoadState("loaded");
                    return;
                  }
                }
                setLoadState("loaded");
              } catch {
                // If we can't access anything, assume it loaded
                setLoadState("loaded");
              }
            }}
            onError={() => setLoadState("error")}
          />
          {/* Overlay to prevent iframe from capturing mouse during resize */}
          {isResizing && <div className="absolute inset-0 z-10" />}
        </div>

        {/* Resize handle */}
        {!isFullscreen && (
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            onMouseDown={handleMouseDown}
            title="Drag to resize"
          >
            <GripVertical className="h-4 w-4 rotate-[-45deg]" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ArticleView({ article, isOpen, onClose }: ArticleViewProps) {
  // Use article.guid as key to reset state when article changes
  const [showIframe, setShowIframe] = useState(false);

  // Reset iframe when dialog closes
  const handleClose = () => {
    setShowIframe(false);
    onClose();
  };

  if (!article) return null;

  // Prefer scraped content, then full content, then snippet
  const contentToDisplay =
    article.scrapedContent ||
    article.content ||
    article.contentSnippet ||
    "No content available";

  const handleVisitOriginal = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowIframe(true);
  };

  return (
    <>
      {/* Hide the dialog when iframe is shown to prevent event capture conflicts */}
      <Dialog
        open={isOpen && !showIframe}
        onOpenChange={(open) => !open && handleClose()}
      >
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
              <button
                onClick={handleVisitOriginal}
                className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                Visit Original <ExternalLink className="w-3 h-3" />
              </button>
              <span className="text-muted-foreground">|</span>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 text-sm"
              >
                Open in new tab <ExternalLink className="w-3 h-3" />
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

      {/* Iframe viewer overlay - shown when user clicks "Visit Original" */}
      {showIframe && (
        <IframeViewer url={article.link} onClose={() => setShowIframe(false)} />
      )}
    </>
  );
}
