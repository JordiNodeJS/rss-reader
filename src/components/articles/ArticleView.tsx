"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Article } from "@/lib/db";
import { useTranslation } from "@/hooks/useTranslation";
import { FlipTitleReveal, FlipHtmlReveal } from "@/components/FlipTextReveal";
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
  Languages,
  RotateCcw,
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
  // "checking" = verifying headers before iframe load, "loading" = iframe is loading
  const [loadState, setLoadState] = useState<
    "checking" | "loading" | "loaded" | "error" | "blocked"
  >("checking");
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  // Pre-check if the URL allows iframe embedding BEFORE rendering the iframe
  useEffect(() => {
    const checkIframeAllowed = async () => {
      try {
        const response = await fetch(
          `/api/check-iframe?url=${encodeURIComponent(url)}`
        );
        const data = await response.json();

        if (data.blocked) {
          setBlockReason(data.reason);
          setLoadState("blocked");
        } else {
          // Only allow iframe to render after check passes
          setLoadState("loading");
        }
      } catch {
        // If check fails, proceed with trying to load the iframe
        setLoadState("loading");
      }
    };

    checkIframeAllowed();
  }, [url]);

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

  // Faster error detection: check multiple times in the first few seconds
  useEffect(() => {
    if (loadState !== "loading") return;

    const checkIframeStatus = () => {
      const iframe = iframeRef.current;
      if (!iframe) return false;

      try {
        const iframeWindow = iframe.contentWindow;
        if (iframeWindow) {
          try {
            const href = iframeWindow.location.href;
            // Detect error pages - can only access href for same-origin or error pages
            if (
              href === "about:blank" ||
              href.includes("chrome-error") ||
              href.includes("blocked")
            ) {
              setLoadState("error");
              return true; // Stop checking
            }

            // If we CAN access the href and it's not the expected URL,
            // it might be an error page rendered by the browser
            // Error pages are same-origin (chrome-error://) so we can access them
            if (!href.startsWith("http")) {
              setLoadState("error");
              return true;
            }

            // Try to check document body - error pages often have specific content
            try {
              const body = iframeWindow.document?.body;
              if (body) {
                const text = body.innerText?.toLowerCase() || "";
                // Common error page text patterns
                if (
                  text.includes("refused") ||
                  text.includes("rechazado") ||
                  text.includes("blocked") ||
                  text.includes("connection") ||
                  text.includes("conexión")
                ) {
                  setLoadState("error");
                  return true;
                }
              }
            } catch {
              // Can't access body - this is fine for cross-origin
            }

            // If we got here and can access href, something is wrong
            // Normal cross-origin pages should throw when accessing location
            setLoadState("error");
            return true;
          } catch {
            // Cross-origin error = page loaded successfully (we can't access it)
            // This is the expected case for properly loaded external pages
            setLoadState("loaded");
            return true; // Stop checking
          }
        }
      } catch {
        // Ignore errors during check
      }
      return false; // Keep checking
    };

    // Check quickly at first, then slow down
    const intervals = [300, 500, 1000, 1500, 2000];
    const timeouts: NodeJS.Timeout[] = [];

    let cumulativeDelay = 0;
    for (const delay of intervals) {
      cumulativeDelay += delay;
      const t = setTimeout(() => {
        if (loadState === "loading") {
          checkIframeStatus();
        }
      }, cumulativeDelay);
      timeouts.push(t);
    }

    return () => timeouts.forEach(clearTimeout);
  }, [loadState]);

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
          {/* Checking/Loading state */}
          {(loadState === "checking" || loadState === "loading") && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">
                  {loadState === "checking"
                    ? "Checking if page can be embedded..."
                    : "Loading article..."}
                </span>
              </div>
            </div>
          )}

          {/* Error state */}
          {(loadState === "error" || loadState === "blocked") && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-4 text-center p-6 max-w-md">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {loadState === "blocked"
                      ? "Page cannot be embedded"
                      : "Cannot load this page"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This website doesn&apos;t allow embedding in iframes for
                    security reasons. This is a common restriction on many
                    websites.
                    {blockReason && (
                      <span className="block mt-2 text-xs font-mono text-muted-foreground/70">
                        ({blockReason})
                      </span>
                    )}
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

          {/* Only render iframe after check passes (loading or loaded state) */}
          {(loadState === "loading" || loadState === "loaded") && (
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
                // Key insight: if we CAN access the iframe's location/content, it's likely an error page
                // because cross-origin pages should block our access
                const iframe = iframeRef.current;
                if (!iframe) return;

                // Small delay to allow error pages to render
                setTimeout(() => {
                  try {
                    const iframeWindow = iframe.contentWindow;
                    if (iframeWindow) {
                      try {
                        // Try to access location - this should FAIL for legitimate cross-origin pages
                        const href = iframeWindow.location.href;

                        // If we can access the href, it's likely an error page
                        // Chrome error pages are same-origin and accessible
                        if (
                          href === "about:blank" ||
                          href.includes("chrome-error") ||
                          href.includes("blocked") ||
                          !href.startsWith("http")
                        ) {
                          setLoadState("error");
                          return;
                        }

                        // Try to check body content for error messages
                        try {
                          const body = iframeWindow.document?.body;
                          if (body) {
                            const text = body.innerText?.toLowerCase() || "";
                            if (
                              text.includes("refused") ||
                              text.includes("rechazado") ||
                              text.includes("blocked") ||
                              text.includes("connection") ||
                              text.includes("conexión") ||
                              text.includes("error")
                            ) {
                              setLoadState("error");
                              return;
                            }
                          }
                        } catch {
                          // Can't access body for cross-origin - this is actually good
                        }

                        // If we got here and could access href, something is wrong
                        // Real cross-origin pages should throw
                        setLoadState("error");
                        return;
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
                }, 300); // Give time for chrome-error pages to fully load
              }}
              onError={() => setLoadState("error")}
            />
          )}
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

  // Translation hook
  const translation = useTranslation({
    article,
    autoTranslate: false,
    cacheTranslations: true,
  });

  // Reset iframe when dialog closes
  const handleClose = () => {
    setShowIframe(false);
    onClose();
  };

  if (!article) return null;

  // Prefer scraped content, then full content, then snippet
  // Get both original and translated content for animation
  const originalContent =
    article.scrapedContent ||
    article.content ||
    article.contentSnippet ||
    "No content available";

  const translatedContent = translation.translatedContent || originalContent;

  // For display (non-animated fallback)
  const contentToDisplay = translation.isShowingTranslation
    ? translatedContent
    : originalContent;

  // Get both original and translated titles
  const originalTitle = article.title;
  const translatedTitle = translation.translatedTitle || article.title;

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
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="outline">
                {new Date(article.pubDate).toLocaleDateString()}
              </Badge>
              {article.scrapedContent && (
                <Badge variant="secondary">Offline Ready</Badge>
              )}
              {translation.isShowingTranslation && (
                <Badge
                  variant="default"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Languages className="w-3 h-3 mr-1" />
                  Traducido al Español
                </Badge>
              )}
              {translation.isEnglish && !translation.isShowingTranslation && (
                <Badge variant="outline" className="text-muted-foreground">
                  <Languages className="w-3 h-3 mr-1" />
                  English
                </Badge>
              )}
            </div>
            <DialogTitle className="text-2xl font-bold leading-tight mb-3">
              <FlipTitleReveal
                originalTitle={originalTitle}
                translatedTitle={translatedTitle}
                showTranslation={translation.isShowingTranslation}
                duration={1.0}
              />
            </DialogTitle>
            <VisuallyHidden>
              <DialogDescription>
                Article content from{" "}
                {new Date(article.pubDate).toLocaleDateString()}
              </DialogDescription>
            </VisuallyHidden>
            <div className="flex items-center gap-2 flex-wrap">
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

              {/* Translation controls */}
              {translation.isEnglish && (
                <>
                  <span className="text-muted-foreground">|</span>
                  {translation.hasCachedTranslation ||
                  translation.status === "completed" ? (
                    <button
                      onClick={translation.toggleTranslation}
                      className="text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 cursor-pointer text-sm font-medium"
                    >
                      <Languages className="w-3 h-3" />
                      {translation.isShowingTranslation
                        ? "Ver original"
                        : "Ver traducción"}
                    </button>
                  ) : translation.status === "translating" ||
                    translation.status === "downloading" ||
                    translation.status === "detecting" ? (
                    <span className="text-muted-foreground flex items-center gap-1 text-sm">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {translation.message || "Traduciendo..."}
                    </span>
                  ) : translation.status === "error" ? (
                    <span className="text-destructive flex items-center gap-1 text-sm">
                      <AlertTriangle className="w-3 h-3" />
                      Error: {translation.error}
                      <button
                        onClick={translation.translate}
                        className="ml-1 hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={translation.translate}
                      className="text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 cursor-pointer text-sm"
                      disabled={!translation.canTranslate}
                    >
                      <Languages className="w-3 h-3" />
                      Traducir al español
                    </button>
                  )}
                </>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-theme">
            <FlipHtmlReveal
              originalHtml={originalContent}
              translatedHtml={translatedContent}
              showTranslation={translation.isShowingTranslation}
              duration={0.6}
              className="prose prose-zinc dark:prose-invert max-w-none px-6 py-6 pr-8 break-words prose-img:max-h-[800px] prose-img:w-auto prose-img:object-contain prose-img:mx-auto"
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
