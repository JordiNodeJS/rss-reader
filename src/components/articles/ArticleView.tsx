"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { Article } from "@/lib/db";
import { useTranslation } from "@/hooks/useTranslation";
import { useSummary, SummarizationProvider } from "@/hooks/useSummary";
import {
  SummaryType,
  SummaryLength,
  SummarizationModelKey,
  DEFAULT_MODEL,
  SUMMARIZATION_MODELS,
} from "@/lib/summarization";
import { SummaryDiagnostics } from "./SummaryDiagnostics";
import { AIDisclaimer } from "@/components/AIDisclaimer";
import { FlipTitleReveal, FlipHtmlReveal } from "@/components/FlipTextReveal";
import { ShimmerLoadingInline } from "@/components/ui/shimmer-loading";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
  GripVertical,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Languages,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Heart,
  User,
  Building2,
  MapPin,
  Tag,
  MessageCircleQuestion,
  TrendingUp,
  TrendingDown,
  Minus,
  GitCompare,
  Zap,
  Link,
  Settings,
} from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
// ProxyRateLimitBadge removed: not used in this component
import { ProviderBadgeDropdown } from "@/components/ui/provider-badge-dropdown";
import { hasStoredApiKey } from "@/lib/summarization-gemini";

interface ArticleViewProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: (id: number) => void;
}

interface IframeViewerProps {
  url: string;
  onClose: () => void;
}

function getLanguageName(code: string) {
  const names: Record<string, string> = {
    en: "English",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    pt: "Português",
    it: "Italiano",
  };
  return names[code] || code.toUpperCase();
}

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "pt", name: "Português" },
  { code: "it", name: "Italiano" },
  { code: "es", name: "Español" },
];

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
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
              onClick={onClose}
              title="Cerrar (Esc)"
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
                    ? "Verificando si la página puede ser incrustada..."
                    : "Cargando artículo..."}
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

                {/* NOTE: Proxy rate limit indicator for summary provider is shown elsewhere (below 'Regenerar' buttons) */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {loadState === "blocked"
                      ? "La página no puede ser incrustada"
                      : "No se puede cargar esta página"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Este sitio web no permite incrustar su contenido en iframes
                    por razones de seguridad. Esta es una restricción común en
                    muchos sitios web.
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
                    Abrir en pestaña nueva
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cerrar
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
              title="Contenido del artículo"
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
            title="Arrastra para redimensionar"
          >
            <GripVertical className="h-4 w-4 rotate-[-45deg]" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ArticleView({
  article,
  isOpen,
  onClose,
  onToggleFavorite,
}: ArticleViewProps) {
  // Use article.guid as key to reset state when article changes
  const [showIframe, setShowIframe] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryType, setSummaryType] = useState<SummaryType>("tldr");
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("medium");

  // AI Provider state with localStorage persistence
  const [aiProvider, setAiProvider] = useState<SummarizationProvider>("local");

  // Selected model with localStorage persistence
  const [selectedModel, setSelectedModel] =
    useState<SummarizationModelKey>(DEFAULT_MODEL);

  // Load saved preferences from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const savedProvider = localStorage.getItem("ai-provider-preference");
      console.log("[ArticleView] useEffect - loading from localStorage:", {
        savedProvider,
      });
      if (
        savedProvider &&
        ["local", "proxy", "gemini", "chrome"].includes(savedProvider)
      ) {
        console.log("[ArticleView] Setting aiProvider to:", savedProvider);
        setAiProvider(savedProvider as SummarizationProvider);
      }
      const savedModel = localStorage.getItem("ai-model-preference");
      if (savedModel && savedModel in SUMMARIZATION_MODELS) {
        setSelectedModel(savedModel as SummarizationModelKey);
      }
    } catch (e) {
      console.error("[ArticleView] localStorage error:", e);
    }
  }, []);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiSettingsFocus, setAiSettingsFocus] = useState<null | "apiKey">(null);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showStopAnimation, setShowStopAnimation] = useState(false);
  const [isFavoriteAnimating, setIsFavoriteAnimating] = useState(false);

  // Check for stored API key on mount
  useEffect(() => {
    setHasGeminiKey(hasStoredApiKey());
  }, []);

  // Handler to change AI provider and persist to localStorage
  const handleAiProviderChange = useCallback(
    (provider: SummarizationProvider) => {
      setAiProvider(provider);
      try {
        localStorage.setItem("ai-provider-preference", provider);
      } catch {
        /* ignore */
      }
    },
    []
  );

  // Handler to change model and persist to localStorage
  const handleModelChange = useCallback((model: SummarizationModelKey) => {
    setSelectedModel(model);
    try {
      localStorage.setItem("ai-model-preference", model);
    } catch {
      /* ignore */
    }
  }, []);

  // New state for resizable view
  const [viewMode, setViewMode] = useState<"default" | "expanded">("default");

  // State for hiding title on mobile scroll
  const [isTitleHidden, setIsTitleHidden] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Resizable modal state
  const [modalSize, setModalSize] = useState({ width: 1152, height: 700 }); // Default: max-w-6xl ≈ 1152px
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const resizeDirection = useRef<"both" | "x" | "y">("both");

  // AI Features state
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  // Track which specific button is currently generating
  const [generatingButtonId, setGeneratingButtonId] = useState<string | null>(
    null
  );
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [entities, setEntities] = useState<
    Array<{
      name: string;
      type: "person" | "org" | "location" | "product" | "event";
    }>
  >([]);
  const [sentiment, setSentiment] = useState<{
    score: number;
    label: "positive" | "negative" | "neutral";
  } | null>(null);
  const [qaItems, setQaItems] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<string | null>(null);

  const handleToggleFavorite = () => {
    if (!article?.id || !onToggleFavorite) return;
    // Only animate when adding to favorites
    if (!article.isFavorite) {
      setIsFavoriteAnimating(true);
      setTimeout(() => setIsFavoriteAnimating(false), 450);
    }
    onToggleFavorite(article.id);
  };

  // Resize handlers
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeDirection.current = "both";
      resizeStartPos.current = { x: e.clientX, y: e.clientY };
      resizeStartSize.current = { ...modalSize };
    },
    [modalSize]
  );

  const handleResizeMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      // Multiply by 2 because the dialog is centered (translate-x-[-50%] translate-y-[-50%])
      // So increasing width by X expands it by X/2 on each side.
      // To keep the edge under the mouse, we need to increase width by 2*X.
      const deltaX = (e.clientX - resizeStartPos.current.x) * 2;
      const deltaY = (e.clientY - resizeStartPos.current.y) * 2;

      setModalSize({
        width:
          resizeDirection.current === "y"
            ? resizeStartSize.current.width
            : Math.max(
                600, // minimum width
                Math.min(
                  window.innerWidth - 40,
                  resizeStartSize.current.width + deltaX
                )
              ),
        height:
          resizeDirection.current === "x"
            ? resizeStartSize.current.height
            : Math.max(
                400, // minimum height
                Math.min(
                  window.innerHeight - 40,
                  resizeStartSize.current.height + deltaY
                )
              ),
      });
    },
    [isResizing]
  );

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove resize event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMouseMove);
      window.addEventListener("mouseup", handleResizeMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleResizeMouseMove);
        window.removeEventListener("mouseup", handleResizeMouseUp);
      };
    }
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  // Handle scroll to hide/show title on mobile
  useEffect(() => {
    if (!isOpen) return;

    let lastScrollY = 0;
    let scrollContainer: HTMLDivElement | null = null;

    const handleScroll = () => {
      if (!scrollContainer) return;
      const currentScrollY = scrollContainer.scrollTop;
      // Only apply on mobile (check window width)
      if (window.innerWidth <= 768) {
        // Hide title when scrolling down past threshold, show when at top
        if (currentScrollY > 60 && currentScrollY > lastScrollY) {
          setIsTitleHidden(true);
        } else if (currentScrollY < 30) {
          setIsTitleHidden(false);
        }
      } else {
        setIsTitleHidden(false);
      }
      lastScrollY = currentScrollY;
    };

    // Also handle window resize to update visibility when switching between mobile/desktop
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsTitleHidden(false);
      }
    };

    // Use a small timeout to ensure the DOM is ready after dialog opens
    const timeoutId = setTimeout(() => {
      scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        scrollContainer.addEventListener("scroll", handleScroll, {
          passive: true,
        });
      }
    }, 50);

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  // Streaming text store - external mutable state for useSyncExternalStore
  const streamStoreRef = useRef({
    text: "",
    isStreaming: false,
    snapshot: { text: "", isStreaming: false }, // Memoized snapshot object
    listeners: new Set<() => void>(),
    subscribe(listener: () => void) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    },
    emit() {
      this.listeners.forEach((l) => l());
    },
    setText(newText: string, streaming: boolean) {
      // Only update if values actually changed
      if (this.text !== newText || this.isStreaming !== streaming) {
        this.text = newText;
        this.isStreaming = streaming;
        // Create new snapshot object only when values change
        this.snapshot = { text: newText, isStreaming: streaming };
        this.emit();
      }
    },
    getSnapshot() {
      return this.snapshot;
    },
  });

  // Cached server snapshot - MUST be stable reference to avoid infinite loop
  const serverSnapshot = useMemo(() => ({ text: "", isStreaming: false }), []);

  // Use external store to avoid direct setState in effect
  const streamState = useSyncExternalStore(
    useCallback(
      (onStoreChange) => streamStoreRef.current.subscribe(onStoreChange),
      []
    ),
    useCallback(() => streamStoreRef.current.getSnapshot(), []),
    () => serverSnapshot
  );

  const displayedSummary = streamState.text;
  const isStreaming = streamState.isStreaming;
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevSummaryRef = useRef<string>("");

  // Translation hook
  const translation = useTranslation({
    article,
    autoTranslate: false,
    cacheTranslations: true,
  });

  // Summary hook
  const summaryHook = useSummary({
    article,
    type: summaryType,
    length: summaryLength,
    cacheSummaries: true,
    provider: aiProvider,
    modelId: selectedModel,
    translateSummary: true, // Translate summaries to Spanish when using local model
  });

  // Memoized timestamp placeholder removed; not required for rate limit UI

  // Streaming effect - updates external store, not React state
  useEffect(() => {
    const fullSummary = summaryHook.summary;
    const store = streamStoreRef.current;

    // Clear any existing streaming
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }

    // No summary - reset store
    if (!fullSummary) {
      if (prevSummaryRef.current) {
        prevSummaryRef.current = "";
        store.setText("", false);
      }
      return;
    }

    // Same summary - ensure fully displayed
    if (fullSummary === prevSummaryRef.current) {
      return;
    }

    // New summary - start streaming
    prevSummaryRef.current = fullSummary;
    store.setText("", true);

    let currentIndex = 0;
    const streamSpeed = 12;
    const chunkSize = 3;

    streamingIntervalRef.current = setInterval(() => {
      currentIndex += chunkSize;
      if (currentIndex >= fullSummary.length) {
        store.setText(fullSummary, false);
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;
        }
      } else {
        store.setText(fullSummary.slice(0, currentIndex), true);
      }
    }, streamSpeed);

    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
    };
  }, [summaryHook.summary]);

  // Reset iframe and summary panel when dialog closes
  const handleClose = () => {
    setShowIframe(false);
    setShowSummary(false);
    setViewMode("default"); // Reset view mode on close
    setModalSize({ width: 1152, height: 700 }); // Reset modal size
    setIsTitleHidden(false); // Reset title visibility
    onClose();
  };

  // Handle summary generation
  const handleGenerateSummary = async (
    type?: SummaryType,
    length?: SummaryLength,
    forceRegenerate?: boolean
  ) => {
    const useType = type || summaryType;
    const useLength = length || summaryLength;
    setSummaryType(useType);
    setSummaryLength(useLength);
    setShowSummary(true);

    // Track regeneration state for animation
    if (forceRegenerate) {
      setIsRegenerating(true);
      setShowStopAnimation(false);
    }

    try {
      await summaryHook.summarize(useType, useLength, forceRegenerate);
    } finally {
      // Clear generating state when done (success or error)
      if (forceRegenerate) {
        setIsRegenerating(false);
        setGeneratingButtonId(null); // Stop specific button animation
        setShowStopAnimation(true);
        // Clear stop animation after it plays
        setTimeout(() => setShowStopAnimation(false), 600);
      }
    }
  };

  // Handle AI button click with animation
  const handleAIButtonClick = (buttonId: string, callback: () => void) => {
    setClickedButton(buttonId);

    // If this is a generation action, set the generating ID
    if (["quick", "keypoints", "detailed", "extended"].includes(buttonId)) {
      setGeneratingButtonId(buttonId);
    }

    setTimeout(() => setClickedButton(null), 200);
    callback();
  };

  // Simulated entity extraction (in real implementation, use NLP model)
  const extractEntities = async () => {
    if (!article) return;
    setIsAnalyzing(true);
    setAnalysisType("entities");

    // Simulate NLP processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const content =
      article.scrapedContent || article.content || article.contentSnippet || "";
    const text = content.replace(/<[^>]*>/g, "");

    // Simple heuristic entity extraction (would use NLP in production)
    const words = text.split(/\s+/);
    const extracted: Array<{
      name: string;
      type: "person" | "org" | "location" | "product" | "event";
    }> = [];

    // Look for capitalized words as potential entities
    const capitalizedPattern = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/;
    const seen = new Set<string>();

    words.forEach((word, i) => {
      const cleanWord = word.replace(/[.,;:!?'"()]/g, "");
      if (
        capitalizedPattern.test(cleanWord) &&
        cleanWord.length > 2 &&
        !seen.has(cleanWord.toLowerCase())
      ) {
        seen.add(cleanWord.toLowerCase());
        // Heuristics for type
        const nextWord = words[i + 1]?.toLowerCase() || "";
        let type: "person" | "org" | "location" | "product" | "event" =
          "person";

        if (
          [
            "inc",
            "corp",
            "ltd",
            "company",
            "co",
            "group",
            "technologies",
            "labs",
          ].some((s) => nextWord.includes(s))
        ) {
          type = "org";
        } else if (
          ["city", "state", "country", "street", "avenue", "plaza"].some((s) =>
            nextWord.includes(s)
          )
        ) {
          type = "location";
        } else if (
          ["model", "version", "series", "edition", "pro", "max", "plus"].some(
            (s) => nextWord.includes(s)
          )
        ) {
          type = "product";
        }

        if (extracted.length < 10) {
          extracted.push({ name: cleanWord, type });
        }
      }
    });

    // Add some common tech entities if found
    const techEntities = [
      "Apple",
      "Google",
      "Microsoft",
      "Amazon",
      "Tesla",
      "Samsung",
      "iPhone",
      "Android",
      "Windows",
      "MacBook",
    ];
    techEntities.forEach((entity) => {
      if (
        text.includes(entity) &&
        !seen.has(entity.toLowerCase()) &&
        extracted.length < 12
      ) {
        seen.add(entity.toLowerCase());
        extracted.push({
          name: entity,
          type: entity.length > 5 ? "org" : "product",
        });
      }
    });

    setEntities(extracted);
    setIsAnalyzing(false);
    setShowAIFeatures(true);
  };

  // Simulated sentiment analysis
  const analyzeSentiment = async () => {
    if (!article) return;
    setIsAnalyzing(true);
    setAnalysisType("sentiment");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const content =
      article.scrapedContent || article.content || article.contentSnippet || "";
    const text = content.replace(/<[^>]*>/g, "").toLowerCase();

    // Simple keyword-based sentiment (would use ML in production)
    const positiveWords = [
      "great",
      "excellent",
      "amazing",
      "fantastic",
      "best",
      "good",
      "love",
      "perfect",
      "wonderful",
      "beautiful",
      "success",
      "win",
      "deal",
      "save",
      "discount",
      "recommend",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "worst",
      "hate",
      "poor",
      "fail",
      "problem",
      "issue",
      "error",
      "wrong",
      "broken",
      "expensive",
      "overpriced",
    ];

    let score = 0;
    positiveWords.forEach((word) => {
      if (text.includes(word)) score += 1;
    });
    negativeWords.forEach((word) => {
      if (text.includes(word)) score -= 1;
    });

    const normalizedScore = Math.max(-1, Math.min(1, score / 5));
    const label: "positive" | "negative" | "neutral" =
      normalizedScore > 0.2
        ? "positive"
        : normalizedScore < -0.2
        ? "negative"
        : "neutral";

    setSentiment({ score: normalizedScore, label });
    setIsAnalyzing(false);
    setShowAIFeatures(true);
  };

  // Generate Q&A from article
  const generateQA = async () => {
    if (!article) return;
    setIsAnalyzing(true);
    setAnalysisType("qa");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const content =
      article.scrapedContent || article.content || article.contentSnippet || "";
    const text = content.replace(/<[^>]*>/g, "");
    const title = article.title || "";

    // Generate contextual questions based on content
    const questions: Array<{ question: string; answer: string }> = [];

    // Question about main topic
    questions.push({
      question: `¿De qué trata este artículo?`,
      answer: title || text.slice(0, 150) + "...",
    });

    // Question about relevance
    if (
      text.toLowerCase().includes("deal") ||
      text.toLowerCase().includes("sale") ||
      text.toLowerCase().includes("discount")
    ) {
      questions.push({
        question: `¿Hay ofertas o descuentos mencionados?`,
        answer: `Sí, el artículo menciona ofertas y promociones que podrían interesarte.`,
      });
    }

    // Question about timing
    if (article.pubDate) {
      questions.push({
        question: `¿Cuándo se publicó esta información?`,
        answer: `Este artículo fue publicado el ${new Date(
          article.pubDate
        ).toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}.`,
      });
    }

    // Question about source
    questions.push({
      question: `¿Cuál es la fuente de esta noticia?`,
      answer: `El artículo proviene de ${
        article.feedTitle || "una fuente RSS"
      } y puedes leer el contenido completo visitando el enlace original.`,
    });

    setQaItems(questions);
    setIsAnalyzing(false);
    setShowAIFeatures(true);
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

  // For display (non-animated fallback) - not needed as we use FlipHtmlReveal directly

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
        <DialogContent
          id="dialog-article-view"
          className={`flex flex-col gap-0 overflow-hidden p-0 ${
            isResizing
              ? "transition-none"
              : "transition-all duration-300 ease-in-out"
          } ${
            viewMode === "expanded" ? "max-w-[98vw] h-[95vh] rounded-md" : ""
          }`}
          style={
            viewMode === "default"
              ? {
                  width: `${modalSize.width}px`,
                  height: `${modalSize.height}px`,
                  maxWidth: "95vw",
                  maxHeight: "92vh",
                }
              : undefined
          }
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">
                  {new Date(article.pubDate).toLocaleDateString()}
                </Badge>
                {article.scrapedContent && (
                  <Badge variant="secondary">Disponible sin conexión</Badge>
                )}
                {article.isFavorite && (
                  <Badge
                    variant="default"
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <Heart className="w-3 h-3 mr-1 fill-current" />
                    Favorito
                  </Badge>
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
                <ProviderBadgeDropdown
                  provider={aiProvider}
                  selectedModel={selectedModel}
                  onProviderChange={handleAiProviderChange}
                  onModelChange={handleModelChange}
                  onOpenSettings={() => {
                    setAiSettingsFocus(null);
                    setShowAISettings(true);
                  }}
                  onRequestApiKey={() => {
                    setAiSettingsFocus("apiKey");
                    setShowAISettings(true);
                  }}
                  proxyRateLimit={summaryHook.proxyRateLimit}
                  hasGeminiKey={hasGeminiKey}
                />
                {translation.sourceLanguage !== "es" &&
                  !translation.isShowingTranslation && (
                    <div className="flex items-center gap-1.5">
                      <Languages className="w-3 h-3 text-muted-foreground shrink-0" />
                      <Select
                        value={
                          translation.sourceLanguage === "unknown"
                            ? ""
                            : translation.sourceLanguage
                        }
                        onValueChange={async (value) => {
                          if (value && value !== translation.sourceLanguage) {
                            await translation.setSourceLanguage(value);
                          }
                        }}
                      >
                        <SelectTrigger
                          className="h-6 text-[10px] px-2 py-0 border-muted-foreground/30 bg-background hover:bg-muted/50 w-fit min-w-[110px] max-w-[140px]"
                          title={
                            translation.sourceLanguage === "unknown"
                              ? "Selecciona el idioma del artículo"
                              : "Cambiar idioma detectado"
                          }
                        >
                          <SelectValue placeholder="Idioma desconocido">
                            {translation.sourceLanguage === "unknown"
                              ? "Seleccionar idioma"
                              : getLanguageName(translation.sourceLanguage)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_LANGUAGES.filter(
                            (lang) => lang.code !== "es"
                          ).map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
              </div>

              {/* Resize Toggle Button */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setViewMode(viewMode === "default" ? "expanded" : "default")
                  }
                  title={
                    viewMode === "default" ? "Expandir vista" : "Vista normal"
                  }
                >
                  {viewMode === "default" ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <DialogTitle
              className={`text-2xl font-bold leading-tight mb-3 transition-all duration-300 md:max-h-none md:opacity-100 md:mb-3 ${
                isTitleHidden
                  ? "max-h-0 opacity-0 mb-0 overflow-hidden"
                  : "max-h-[200px] opacity-100"
              }`}
            >
              <FlipTitleReveal
                originalTitle={originalTitle}
                translatedTitle={translatedTitle}
                showTranslation={translation.isShowingTranslation}
                duration={2.5}
              />
            </DialogTitle>
            <VisuallyHidden>
              <DialogDescription>
                Article content from{" "}
                {new Date(article.pubDate).toLocaleDateString()}
              </DialogDescription>
            </VisuallyHidden>
            {/* Action buttons - collapsible on mobile */}
            <div
              className={`flex items-center gap-2 flex-wrap transition-all duration-300 md:max-h-none md:opacity-100 md:mb-2 ${
                isTitleHidden
                  ? "max-h-0 opacity-0 mb-0 overflow-hidden"
                  : "max-h-[100px] opacity-100 mb-2"
              }`}
            >
              {/* Mobile: Compact icon buttons */}
              <div className="flex md:hidden items-center gap-1">
                {/* Favorite button - always visible */}
                {onToggleFavorite && (
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2 rounded-full transition-colors heart-button ${
                      article.isFavorite
                        ? "text-red-500 bg-red-500/10"
                        : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    } ${isFavoriteAnimating ? "animate-burst" : ""}`}
                    title={
                      article.isFavorite
                        ? "Quitar de favoritos"
                        : "Añadir a favoritos"
                    }
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        article.isFavorite ? "fill-current" : ""
                      } ${isFavoriteAnimating ? "animate-heart-pop" : ""}`}
                    />
                  </button>
                )}
                {/* View original */}
                <button
                  onClick={handleVisitOriginal}
                  className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Ver original"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                {/* Open in new tab */}
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Abrir en pestaña nueva"
                >
                  <Link className="w-4 h-4" />
                </a>
              </div>

              {/* Desktop: Full text buttons */}
              <div className="hidden md:flex items-center gap-2 flex-wrap">
                {onToggleFavorite && (
                  <>
                    <button
                      onClick={handleToggleFavorite}
                      className={`flex items-center gap-1 cursor-pointer text-sm transition-colors heart-button ${
                        article.isFavorite
                          ? "text-red-500 hover:text-red-600"
                          : "text-muted-foreground hover:text-red-500"
                      } ${isFavoriteAnimating ? "animate-burst" : ""}`}
                      title={
                        article.isFavorite
                          ? "Quitar de favoritos"
                          : "Añadir a favoritos"
                      }
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          article.isFavorite ? "fill-current" : ""
                        } ${isFavoriteAnimating ? "animate-heart-pop" : ""}`}
                      />
                      {article.isFavorite ? "Favorito" : "Añadir a favoritos"}
                    </button>
                    <span className="text-muted-foreground">|</span>
                  </>
                )}
                <button
                  onClick={handleVisitOriginal}
                  className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Ver original <ExternalLink className="w-3 h-3" />
                </button>
                <span className="text-muted-foreground">|</span>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  Abrir en pestaña nueva <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* AI Summary & Translation controls - compact bar that hides on mobile scroll */}
            <div
              className={`flex items-center gap-2 flex-wrap text-sm transition-all duration-300 md:max-h-none md:opacity-100 ${
                isTitleHidden
                  ? "max-h-0 opacity-0 overflow-hidden"
                  : "max-h-[200px] opacity-100"
              }`}
            >
              {/* AI Summary controls */}
              {summaryHook.isGeminiAvailable ||
              summaryHook.isTransformersAvailable ? (
                <>
                  <span className="text-muted-foreground">|</span>
                  {summaryHook.hasCachedSummary ||
                  summaryHook.status === "completed" ||
                  isRegenerating ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSummary(!showSummary)}
                        className="text-purple-500 hover:text-purple-600 hover:underline flex items-center gap-1 cursor-pointer text-sm font-medium"
                      >
                        <Sparkles className="w-3 h-3" />
                        {showSummary ? "Ocultar resumen" : "Ver resumen"}
                        {showSummary ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleGenerateSummary(undefined, undefined, true)
                        }
                        className={`text-purple-400 hover:text-purple-500 cursor-pointer p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors ${
                          isRegenerating ? "animate-spin" : ""
                        } ${
                          showStopAnimation
                            ? "animate-regenerate-stop text-green-500"
                            : ""
                        }`}
                        title="Regenerar resumen"
                        data-qa="article-regenerate-button"
                        disabled={isRegenerating}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : summaryHook.status === "summarizing" ||
                    summaryHook.status === "downloading" ||
                    summaryHook.status === "checking" ? (
                    <ShimmerLoadingInline
                      message={summaryHook.message || "Generando resumen..."}
                      variant="purple"
                    />
                  ) : summaryHook.status === "error" ? (
                    <span className="text-destructive flex items-center gap-1 text-sm">
                      <AlertTriangle className="w-3 h-3" />
                      Error: {summaryHook.error}
                      <button
                        onClick={() => handleGenerateSummary()}
                        className="ml-1 hover:underline"
                        data-qa="article-regenerate-button-retry"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleGenerateSummary()}
                        className="text-purple-500 hover:text-purple-600 hover:underline flex items-center gap-1 cursor-pointer text-sm flex-wrap"
                        disabled={!summaryHook.canSummarize}
                        title={
                          summaryHook.isTransformersAvailable &&
                          !summaryHook.isGeminiAvailable
                            ? "Resumen generado localmente y traducido al español"
                            : summaryHook.isGeminiAvailable
                            ? "Resumen generado con Google Gemini"
                            : undefined
                        }
                        data-qa="article-generate-button"
                      >
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Generar resumen con IA</span>
                        </span>
                        {aiProvider === "local" && (
                          <span className="text-[10px] opacity-70 ml-1 whitespace-nowrap">
                            (local
                            {selectedModel && SUMMARIZATION_MODELS[selectedModel]
                              ? `: ${SUMMARIZATION_MODELS[selectedModel].name}`
                              : ""}
                            )
                          </span>
                        )}
                        {aiProvider === "gemini" && (
                          <span className="text-[10px] opacity-70 ml-1 whitespace-nowrap">
                            (gemini)
                          </span>
                        )}
                        {aiProvider === "proxy" && (
                          <span className="text-[10px] opacity-70 ml-1 whitespace-nowrap">
                            (proxy gratis)
                          </span>
                        )}
                        {aiProvider === "chrome" && (
                          <span className="text-[10px] opacity-70 ml-1 whitespace-nowrap">
                            (chrome ai)
                          </span>
                        )}
                      </button>
                      {/* AI Settings Button */}
                      <button
                        onClick={() => setShowAISettings(true)}
                        className="text-muted-foreground hover:text-purple-500 p-1 rounded transition-colors flex-shrink-0"
                        title="Configurar proveedor de IA"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // Show info when API is not available
                <>
                  <span className="text-muted-foreground">|</span>
                  {summaryHook.availabilityError &&
                  summaryHook.availabilityError.includes("space") ? (
                    // Show prominent warning for insufficient space
                    <span
                      className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1"
                      title={summaryHook.availabilityError}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span className="hidden sm:inline">
                        Espacio insuficiente
                      </span>
                      <details className="inline relative">
                        <summary className="cursor-pointer ml-1 hover:text-orange-700 dark:hover:text-orange-300">
                          ℹ️
                        </summary>
                        <div className="absolute mt-2 right-0 p-3 bg-orange-500/10 border border-orange-500/20 rounded shadow-lg z-50 max-w-sm">
                          <SummaryDiagnostics
                            errorMessage={summaryHook.availabilityError}
                          />
                        </div>
                      </details>
                    </span>
                  ) : (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3 opacity-50" />
                        <span className="hidden sm:inline">Resumen IA</span>
                      </summary>
                      <div className="mt-2 p-2 bg-muted rounded border">
                        <SummaryDiagnostics />
                      </div>
                    </details>
                  )}
                </>
              )}

              {/* Translation controls */}
              {translation.sourceLanguage !== "es" &&
                translation.sourceLanguage !== "unknown" && (
                  <>
                    <span className="text-muted-foreground">|</span>
                    {translation.hasCachedTranslation ||
                    translation.status === "completed" ? (
                      <button
                        onClick={translation.toggleTranslation}
                        className="text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 cursor-pointer text-sm font-medium"
                        data-qa="article-translate-button"
                      >
                        <Languages className="w-3 h-3" />
                        {translation.isShowingTranslation
                          ? "Ver original"
                          : "Ver traducción"}
                      </button>
                    ) : translation.status === "translating" ||
                      translation.status === "downloading" ||
                      translation.status === "detecting" ? (
                      <span className="text-muted-foreground flex items-center gap-1 text-sm min-h-[2.5em] max-w-[300px]">
                        <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                        <span className="line-clamp-2">
                          {translation.message || "Traduciendo..."}
                        </span>
                      </span>
                    ) : translation.status === "error" ? (
                      <span className="text-destructive flex items-center gap-1 text-sm">
                        <AlertTriangle className="w-3 h-3" />
                        Error: {translation.error}
                        <button
                          onClick={translation.translate}
                          className="ml-1 hover:underline"
                        >
                          <RefreshCw className="w-3 h-3" />
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

          {/* Main Scrollable Content */}
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto scrollbar-theme"
          >
            {/* AI Summary Panel */}
            {showSummary && summaryHook.summary && (
              <div
                className={`mx-6 mb-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 spring-expand-container ${
                  isStreaming ? "streaming" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className={`w-4 h-4 text-purple-500 ${
                        isStreaming ? "animate-pulse" : ""
                      }`}
                    />
                    <span className="font-medium text-sm text-purple-600 dark:text-purple-400">
                      Resumen IA
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {summaryHook.summaryType === "key-points"
                        ? "Puntos clave"
                        : summaryHook.summaryType === "tldr"
                        ? "TL;DR"
                        : summaryHook.summaryType === "teaser"
                        ? "Teaser"
                        : "Titular"}
                    </Badge>
                    {summaryHook.summaryLength === "extended" && (
                      <Badge
                        variant="default"
                        className="text-xs bg-purple-600"
                      >
                        Extendido
                      </Badge>
                    )}
                    {/* Show provider badge */}
                    {summaryHook.activeBackend === "gemini" ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] opacity-70"
                        title="Resumen generado con Google Gemini"
                      >
                        gemini
                      </Badge>
                    ) : summaryHook.activeBackend === "proxy" ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] opacity-70"
                        title="Resumen generado con API proxy gratuita"
                      >
                        proxy
                      </Badge>
                    ) : summaryHook.activeBackend === "chrome" ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] opacity-70"
                        title="Resumen generado con Chrome AI (Gemini Nano)"
                      >
                        chrome ai
                      </Badge>
                    ) : (
                      summaryHook.activeBackend === "transformers" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] opacity-70"
                          title="Resumen generado localmente y traducido al español"
                        >
                          local
                        </Badge>
                      )
                    )}
                    {isStreaming && (
                      <span className="text-xs text-purple-400 animate-pulse">
                        escribiendo...
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {summaryHook.summaryType === "key-points" ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: displayedSummary
                          .replace(/^[-•*]\s*/gm, "")
                          .split("\n")
                          .filter((line) => line.trim())
                          .map((point) => `<li>${point.trim()}</li>`)
                          .join(""),
                      }}
                      className="list-disc list-inside space-y-1"
                    />
                  ) : (
                    <p className="text-foreground/90 leading-relaxed">
                      {displayedSummary}
                      {isStreaming && (
                        <span className="inline-block w-0.5 h-4 bg-purple-500 ml-0.5 animate-blink align-middle" />
                      )}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-purple-500/20">
                  <span className="text-xs text-muted-foreground">
                    Regenerar:
                  </span>
                  <button
                    onClick={() =>
                      handleAIButtonClick("quick", () =>
                        handleGenerateSummary("tldr", "short", true)
                      )
                    }
                    className={`ai-button text-xs px-2 py-1 rounded transition-all ${
                      summaryHook.summaryLength === "short"
                        ? "bg-purple-500/30 ring-2 ring-purple-500/50 text-purple-700 dark:text-purple-300 font-medium"
                        : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                    } ${clickedButton === "quick" ? "clicked" : ""} ${
                      generatingButtonId === "quick"
                        ? "regenerating-border"
                        : ""
                    }`}
                    disabled={
                      summaryHook.status === "summarizing" ||
                      (aiProvider === "proxy" &&
                        summaryHook.proxyRateLimit?.remaining === 0)
                    }
                    title="Resumen rápido de 1-2 frases"
                  >
                    <Zap className="w-3 h-3 inline mr-1 ai-sparkle-icon" />
                    Rápido
                  </button>
                  <button
                    onClick={() =>
                      handleAIButtonClick("keypoints", () =>
                        handleGenerateSummary("key-points", "medium", true)
                      )
                    }
                    className={`ai-button text-xs px-2 py-1 rounded transition-all ${
                      summaryHook.summaryType === "key-points" &&
                      summaryHook.summaryLength === "medium"
                        ? "bg-purple-500/30 ring-2 ring-purple-500/50 text-purple-700 dark:text-purple-300 font-medium"
                        : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                    } ${clickedButton === "keypoints" ? "clicked" : ""} ${
                      generatingButtonId === "keypoints"
                        ? "regenerating-border"
                        : ""
                    }`}
                    disabled={
                      summaryHook.status === "summarizing" ||
                      (aiProvider === "proxy" &&
                        summaryHook.proxyRateLimit?.remaining === 0)
                    }
                    title="Puntos clave en formato lista"
                  >
                    Puntos clave
                  </button>
                  <button
                    onClick={() =>
                      handleAIButtonClick("detailed", () =>
                        handleGenerateSummary("tldr", "long", true)
                      )
                    }
                    className={`ai-button text-xs px-2 py-1 rounded transition-all ${
                      summaryHook.summaryLength === "long"
                        ? "bg-purple-500/30 ring-2 ring-purple-500/50 text-purple-700 dark:text-purple-300 font-medium"
                        : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                    } ${clickedButton === "detailed" ? "clicked" : ""} ${
                      generatingButtonId === "detailed"
                        ? "regenerating-border"
                        : ""
                    }`}
                    disabled={
                      summaryHook.status === "summarizing" ||
                      (aiProvider === "proxy" &&
                        summaryHook.proxyRateLimit?.remaining === 0)
                    }
                    title="Resumen detallado de 5 frases"
                  >
                    Detallado
                  </button>
                  <button
                    onClick={() =>
                      handleAIButtonClick("extended", () =>
                        handleGenerateSummary("tldr", "extended", true)
                      )
                    }
                    className={`ai-button text-xs px-2 py-1 rounded border transition-all ${
                      summaryHook.summaryLength === "extended"
                        ? "bg-purple-500/40 ring-2 ring-purple-500/60 text-purple-700 dark:text-purple-200 font-semibold border-purple-500/50"
                        : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 font-medium border-purple-500/30"
                    } ${clickedButton === "extended" ? "clicked" : ""} ${
                      generatingButtonId === "extended"
                        ? "regenerating-border"
                        : ""
                    }`}
                    disabled={
                      summaryHook.status === "summarizing" ||
                      (aiProvider === "proxy" &&
                        summaryHook.proxyRateLimit?.remaining === 0)
                    }
                    title="Resumen extenso para comprender mejor la noticia (7-10 frases)"
                    data-qa="extended-summary-button"
                  >
                    <Sparkles className="w-3 h-3 inline mr-1 ai-sparkle-icon" />
                    Extendido
                  </button>
                </div>

                {/* AI Analysis Features */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-purple-500/20">
                  <span className="text-xs text-muted-foreground">
                    Análisis IA:
                  </span>
                  <button
                    onClick={() =>
                      handleAIButtonClick("entities", extractEntities)
                    }
                    className={`ai-button text-xs px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all ${
                      clickedButton === "entities" ? "clicked" : ""
                    } ${
                      isAnalyzing && analysisType === "entities"
                        ? "opacity-50"
                        : ""
                    }`}
                    disabled={isAnalyzing}
                    title="Detectar personas, organizaciones y lugares mencionados"
                  >
                    <Tag className="w-3 h-3 inline mr-1 ai-sparkle-icon" />
                    Entidades
                  </button>
                  <button
                    onClick={() =>
                      handleAIButtonClick("sentiment", analyzeSentiment)
                    }
                    className={`ai-button text-xs px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-all ${
                      clickedButton === "sentiment" ? "clicked" : ""
                    } ${
                      isAnalyzing && analysisType === "sentiment"
                        ? "opacity-50"
                        : ""
                    }`}
                    disabled={isAnalyzing}
                    title="Analizar el tono general del artículo"
                  >
                    <TrendingUp className="w-3 h-3 inline mr-1 ai-sparkle-icon" />
                    Sentimiento
                  </button>
                  <button
                    onClick={() => handleAIButtonClick("qa", generateQA)}
                    className={`ai-button text-xs px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-all ${
                      clickedButton === "qa" ? "clicked" : ""
                    } ${
                      isAnalyzing && analysisType === "qa" ? "opacity-50" : ""
                    }`}
                    disabled={isAnalyzing}
                    title="Generar preguntas y respuestas sobre el artículo"
                  >
                    <MessageCircleQuestion className="w-3 h-3 inline mr-1 ai-sparkle-icon" />
                    Q&A
                  </button>
                  <button
                    onClick={() =>
                      handleAIButtonClick("compare", () =>
                        setShowAIFeatures((prev) => !prev)
                      )
                    }
                    className={`ai-button text-xs px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all ${
                      clickedButton === "compare" ? "clicked" : ""
                    }`}
                    title="Comparar con otros artículos del mismo día"
                  >
                    <GitCompare className="w-3 h-3 inline mr-1 ai-sparkle-icon" />
                    Comparar
                  </button>
                  {isAnalyzing && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analizando...
                    </span>
                  )}
                </div>

                {/* AI Analysis Results */}
                {showAIFeatures &&
                  (entities.length > 0 || sentiment || qaItems.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-purple-500/20 space-y-3">
                      {/* Entities */}
                      {entities.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-3 h-3 text-blue-500" />
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              Entidades detectadas
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {entities.map((entity, i) => (
                              <span
                                key={i}
                                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                                  entity.type === "person"
                                    ? "entity-person"
                                    : entity.type === "org"
                                    ? "entity-org"
                                    : entity.type === "location"
                                    ? "entity-location"
                                    : entity.type === "product"
                                    ? "entity-product"
                                    : "entity-event"
                                }`}
                                title={
                                  entity.type === "person"
                                    ? "Persona"
                                    : entity.type === "org"
                                    ? "Organización"
                                    : entity.type === "location"
                                    ? "Lugar"
                                    : entity.type === "product"
                                    ? "Producto"
                                    : "Evento"
                                }
                              >
                                {entity.type === "person" && (
                                  <User className="w-2.5 h-2.5 inline mr-1" />
                                )}
                                {entity.type === "org" && (
                                  <Building2 className="w-2.5 h-2.5 inline mr-1" />
                                )}
                                {entity.type === "location" && (
                                  <MapPin className="w-2.5 h-2.5 inline mr-1" />
                                )}
                                {entity.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sentiment */}
                      {sentiment && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {sentiment.label === "positive" ? (
                              <TrendingUp className="w-3 h-3 sentiment-positive" />
                            ) : sentiment.label === "negative" ? (
                              <TrendingDown className="w-3 h-3 sentiment-negative" />
                            ) : (
                              <Minus className="w-3 h-3 sentiment-neutral" />
                            )}
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              Análisis de sentimiento
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  sentiment.label === "positive"
                                    ? "bg-green-500"
                                    : sentiment.label === "negative"
                                    ? "bg-red-500"
                                    : "bg-gray-400"
                                }`}
                                style={{
                                  width: `${
                                    Math.abs(sentiment.score) * 50 + 50
                                  }%`,
                                }}
                              />
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                sentiment.label === "positive"
                                  ? "border-green-500/30 text-green-600"
                                  : sentiment.label === "negative"
                                  ? "border-red-500/30 text-red-600"
                                  : "border-gray-500/30 text-gray-600"
                              }`}
                            >
                              {sentiment.label === "positive"
                                ? "😊 Positivo"
                                : sentiment.label === "negative"
                                ? "😟 Negativo"
                                : "😐 Neutral"}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Q&A */}
                      {qaItems.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircleQuestion className="w-3 h-3 text-amber-500" />
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              Preguntas frecuentes
                            </span>
                          </div>
                          <div className="space-y-2">
                            {qaItems.map((item, i) => (
                              <div
                                key={i}
                                className="rounded-lg overflow-hidden"
                              >
                                <div className="qa-question px-3 py-2">
                                  <span className="text-xs font-medium">
                                    ❓ {item.question}
                                  </span>
                                </div>
                                <div className="qa-answer px-3 py-2">
                                  <span className="text-xs text-muted-foreground">
                                    {item.answer}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* Article Content Area */}
            <div className="flex flex-col">
              <div className="sticky top-0 z-10 flex items-center justify-end gap-2 px-6 py-2 border-y bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <span className="text-xs text-muted-foreground mr-auto">
                  Contenido del artículo
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    setViewMode(viewMode === "default" ? "expanded" : "default")
                  }
                  title={
                    viewMode === "default"
                      ? "Expandir contenido"
                      : "Vista normal"
                  }
                >
                  {viewMode === "default" ? (
                    <>
                      <Maximize2 className="h-3 w-3 mr-1" />
                      Expandir
                    </>
                  ) : (
                    <>
                      <Minimize2 className="h-3 w-3 mr-1" />
                      Normal
                    </>
                  )}
                </Button>
              </div>
              <div
                className={`transition-all duration-300 ${
                  viewMode === "expanded" ? "" : ""
                }`}
              >
                <FlipHtmlReveal
                  originalHtml={originalContent}
                  translatedHtml={translatedContent}
                  showTranslation={translation.isShowingTranslation}
                  duration={1.2}
                  className="prose prose-zinc dark:prose-invert max-w-none px-6 py-6 pr-8 break-words prose-img:max-h-[800px] prose-img:w-auto prose-img:object-contain prose-img:mx-auto"
                />
              </div>
            </div>
          </div>

          {/* Resize handles - only show in default mode */}
          {viewMode === "default" && (
            <>
              {/* Corner resize handle (bottom-right) */}
              <div
                className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-10 group"
                onMouseDown={handleResizeMouseDown}
                title="Arrastra para redimensionar"
              >
                <div className="absolute inset-0 bg-gradient-to-tl from-primary/20 to-transparent rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <GripVertical className="h-5 w-5 rotate-[-45deg] relative z-10 drop-shadow-sm" />
              </div>

              {/* Right edge resize handle */}
              <div
                className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/10 transition-colors z-10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsResizing(true);
                  resizeDirection.current = "x";
                  resizeStartPos.current = { x: e.clientX, y: e.clientY };
                  resizeStartSize.current = { ...modalSize };
                }}
                title="Arrastra para redimensionar horizontalmente"
              />

              {/* Bottom edge resize handle */}
              <div
                className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize hover:bg-primary/10 transition-colors z-10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsResizing(true);
                  resizeDirection.current = "y";
                  resizeStartPos.current = { x: e.clientX, y: e.clientY };
                  resizeStartSize.current = { ...modalSize };
                }}
                title="Arrastra para redimensionar verticalmente"
              />

              {/* Overlay to prevent content interaction during resize */}
              {isResizing && (
                <div className="absolute inset-0 z-[9] cursor-se-resize" />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Iframe viewer overlay - shown when user clicks "Visit Original" */}
      {showIframe && (
        <IframeViewer url={article.link} onClose={() => setShowIframe(false)} />
      )}

      {/* AI Settings Dialog */}
      {showAISettings && (
        <Dialog
          open={showAISettings}
          onOpenChange={(open) => {
            setShowAISettings(open);
            if (!open) setAiSettingsFocus(null);
          }}
        >
          {/* Make dialog content scrollable on small screens to ensure the full
            configuration box is reachable on mobile devices */}
          <DialogContent className="w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-background/50 backdrop-blur-sm z-10">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Configuración de IA
              </DialogTitle>
              <DialogDescription>
                Elige cómo generar los resúmenes de artículos
              </DialogDescription>
            </DialogHeader>
            <AIDisclaimer
              provider={aiProvider}
              onProviderChange={handleAiProviderChange}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              isTranslationAvailable={translation.canTranslate}
              compact={false}
              focusApiKey={aiSettingsFocus === "apiKey"}
            />
            {/* Footer with Accept button */}
            <div className="sticky bottom-0 pt-4 pb-2 bg-background/80 backdrop-blur-sm border-t mt-4">
              <div className="flex justify-end gap-2">
                <Button
                  variant="default"
                  onClick={() => setShowAISettings(false)}
                  className="min-w-[100px]"
                >
                  Aceptar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
