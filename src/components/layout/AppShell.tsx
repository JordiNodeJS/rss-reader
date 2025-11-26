"use client";

// Created by webcode.es
// Contact: info@webcode.es

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Plus,
  Trash2,
  Inbox,
  Trash,
  Pencil,
  Languages,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useFeeds } from "@/hooks/useFeeds";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Feed } from "@/lib/db";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  clearTranslationModelCache,
  getTranslationCacheSize,
} from "@/lib/translation";
import { toast } from "sonner";

interface AppShellProps {
  children: React.ReactNode;
  feedState: ReturnType<typeof useFeeds>;
}

// Estructura de feeds organizada por medio y secciones
interface FeedSection {
  name: string;
  url: string;
}

interface FeedSource {
  name: string;
  sections: FeedSection[];
}

interface FeedCategory {
  category: string;
  sources: FeedSource[];
}

const ORGANIZED_FEEDS: FeedCategory[] = [
  {
    category: "🇪🇸 Medios Españoles",
    sources: [
      {
        name: "El País",
        sections: [
          {
            name: "Portada",
            url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",
          },
          {
            name: "España",
            url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/espana/portada",
          },
          {
            name: "Internacional",
            url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada",
          },
          {
            name: "Economía",
            url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada",
          },
          {
            name: "Tecnología",
            url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/tecnologia/portada",
          },
          {
            name: "Cultura",
            url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/cultura/portada",
          },
          {
            name: "Deportes",
            url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/deportes/portada",
          },
        ],
      },
      {
        name: "La Vanguardia",
        sections: [
          { name: "Portada", url: "https://www.lavanguardia.com/rss/home.xml" },
          {
            name: "Política",
            url: "https://www.lavanguardia.com/rss/politica.xml",
          },
          {
            name: "Internacional",
            url: "https://www.lavanguardia.com/rss/internacional.xml",
          },
          {
            name: "Economía",
            url: "https://www.lavanguardia.com/rss/economia.xml",
          },
          {
            name: "Tecnología",
            url: "https://www.lavanguardia.com/rss/tecnologia.xml",
          },
          {
            name: "Cultura",
            url: "https://www.lavanguardia.com/rss/cultura.xml",
          },
          {
            name: "Deportes",
            url: "https://www.lavanguardia.com/rss/deportes.xml",
          },
        ],
      },
      {
        name: "El Diario",
        sections: [
          { name: "Portada", url: "https://www.eldiario.es/rss/" },
          { name: "Política", url: "https://www.eldiario.es/politica/rss/" },
          { name: "Economía", url: "https://www.eldiario.es/economia/rss/" },
          { name: "Sociedad", url: "https://www.eldiario.es/sociedad/rss/" },
          {
            name: "Internacional",
            url: "https://www.eldiario.es/internacional/rss/",
          },
          { name: "Cultura", url: "https://www.eldiario.es/cultura/rss/" },
          {
            name: "Tecnología",
            url: "https://www.eldiario.es/tecnologia/rss/",
          },
        ],
      },
      {
        name: "20 Minutos",
        sections: [
          { name: "Portada", url: "https://www.20minutos.es/rss/" },
          { name: "Nacional", url: "https://www.20minutos.es/rss/nacional/" },
          {
            name: "Internacional",
            url: "https://www.20minutos.es/rss/internacional/",
          },
          { name: "Economía", url: "https://www.20minutos.es/rss/economia/" },
          { name: "Deportes", url: "https://www.20minutos.es/rss/deportes/" },
          {
            name: "Tecnología",
            url: "https://www.20minutos.es/rss/tecnologia/",
          },
        ],
      },
      {
        name: "Público",
        sections: [{ name: "Portada", url: "https://www.publico.es/rss/" }],
      },
      {
        name: "La Marea",
        sections: [{ name: "Portada", url: "https://www.lamarea.com/feed/" }],
      },
      {
        name: "Newtral",
        sections: [{ name: "Portada", url: "https://www.newtral.es/feed/" }],
      },
      {
        name: "Cuarto Poder",
        sections: [
          { name: "Portada", url: "https://www.cuartopoder.es/feed/" },
        ],
      },
      {
        name: "CTXT Contexto",
        sections: [{ name: "Portada", url: "https://ctxt.es/es/rss/ctxt.xml" }],
      },
      {
        name: "Kaos en la Red",
        sections: [{ name: "Portada", url: "https://kaosenlared.net/feed/" }],
      },
      {
        name: "RTVE Noticias",
        sections: [
          { name: "Portada", url: "https://www.rtve.es/noticias/rss.xml" },
        ],
      },
    ],
  },
  {
    category: "🌍 Medios Internacionales (Español)",
    sources: [
      {
        name: "BBC Mundo",
        sections: [
          { name: "Portada", url: "https://feeds.bbci.co.uk/mundo/rss.xml" },
        ],
      },
      {
        name: "DW en Español",
        sections: [
          { name: "Portada", url: "https://rss.dw.com/xml/rss-sp-top" },
        ],
      },
      {
        name: "Euronews Español",
        sections: [{ name: "Portada", url: "https://es.euronews.com/rss" }],
      },
      {
        name: "France24 Español",
        sections: [{ name: "Portada", url: "https://www.france24.com/es/rss" }],
      },
    ],
  },
  {
    category: "🇬🇧 Medios Internacionales (Inglés)",
    sources: [
      {
        name: "The Guardian",
        sections: [
          { name: "World", url: "https://www.theguardian.com/world/rss" },
          { name: "UK News", url: "https://www.theguardian.com/uk-news/rss" },
          { name: "US News", url: "https://www.theguardian.com/us-news/rss" },
          {
            name: "Technology",
            url: "https://www.theguardian.com/uk/technology/rss",
          },
          { name: "Science", url: "https://www.theguardian.com/science/rss" },
          {
            name: "Environment",
            url: "https://www.theguardian.com/environment/rss",
          },
        ],
      },
      {
        name: "BBC News",
        sections: [
          { name: "World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
          { name: "UK", url: "https://feeds.bbci.co.uk/news/uk/rss.xml" },
          {
            name: "Technology",
            url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
          },
          {
            name: "Science",
            url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
          },
        ],
      },
      {
        name: "NPR",
        sections: [
          { name: "World News", url: "https://feeds.npr.org/1004/rss.xml" },
        ],
      },
      {
        name: "Vox",
        sections: [{ name: "All", url: "https://www.vox.com/rss/index.xml" }],
      },
      {
        name: "The Independent",
        sections: [
          { name: "World", url: "http://www.independent.co.uk/news/world/rss" },
        ],
      },
      {
        name: "Al Jazeera",
        sections: [
          { name: "All", url: "https://www.aljazeera.com/xml/rss/all.xml" },
        ],
      },
      {
        name: "Der Spiegel International",
        sections: [
          {
            name: "International",
            url: "https://www.spiegel.de/international/index.rss",
          },
        ],
      },
    ],
  },
  {
    category: "💻 Tecnología",
    sources: [
      {
        name: "Ars Technica",
        sections: [
          {
            name: "All",
            url: "https://feeds.arstechnica.com/arstechnica/index",
          },
        ],
      },
      {
        name: "The Verge",
        sections: [
          { name: "All", url: "https://www.theverge.com/rss/index.xml" },
        ],
      },
      {
        name: "Wired",
        sections: [{ name: "All", url: "https://www.wired.com/feed/rss" }],
      },
      {
        name: "Xataka",
        sections: [
          { name: "All", url: "https://www.xataka.com/feedburner.xml" },
        ],
      },
      {
        name: "Genbeta",
        sections: [
          { name: "All", url: "https://www.genbeta.com/feedburner.xml" },
        ],
      },
    ],
  },
  {
    category: "📚 Cultura y Sociedad",
    sources: [
      {
        name: "Le Monde Diplomatique ES",
        sections: [
          {
            name: "All",
            url: "https://mondiplo.com/local/cache-rss/local.xml",
          },
        ],
      },
      {
        name: "The Conversation",
        sections: [
          {
            name: "World News",
            url: "https://theconversation.com/topics/world-news-156028/articles.atom",
          },
        ],
      },
      {
        name: "Global Issues",
        sections: [
          { name: "News", url: "https://www.globalissues.org/news/feed" },
        ],
      },
      {
        name: "Alternet",
        sections: [
          { name: "World", url: "https://www.alternet.org/feeds/world.rss" },
        ],
      },
    ],
  },
];

// Flatten for backwards compatibility where needed
const DEFAULT_FEEDS = ORGANIZED_FEEDS.flatMap((category) =>
  category.sources.flatMap((source) =>
    source.sections.map((section) => ({
      name:
        source.sections.length > 1
          ? `${source.name} - ${section.name}`
          : source.name,
      url: section.url,
    }))
  )
);

interface SidebarContentProps {
  feeds: Feed[];
  selectedFeedId: number | null;
  setSelectedFeedId: (id: number | null) => void;
  removeFeed: (id: number) => void;
  addNewFeed: (url: string, customTitle?: string) => Promise<void>;
  updateFeedTitle: (id: number, customTitle: string) => Promise<void>;
  clearCache: () => Promise<void>;
  isLoading: boolean;
}

function SidebarContent({
  feeds,
  selectedFeedId,
  setSelectedFeedId,
  removeFeed,
  addNewFeed,
  updateFeedTitle,
  clearCache,
  isLoading,
}: SidebarContentProps) {
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedTitle, setNewFeedTitle] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleAddFeed = async () => {
    if (!newFeedUrl) return;
    await addNewFeed(newFeedUrl, newFeedTitle || undefined);
    setNewFeedUrl("");
    setNewFeedTitle("");
    setIsAddDialogOpen(false);
  };

  const handleAddDefault = (url: string) => {
    setNewFeedUrl(url);
    // Auto-fill title from preset
    const preset = DEFAULT_FEEDS.find((f) => f.url === url);
    if (preset) {
      setNewFeedTitle(preset.name);
    }
  };

  const handleEditFeed = async () => {
    if (!editingFeed?.id) return;
    await updateFeedTitle(editingFeed.id, editTitle);
    setEditingFeed(null);
    setEditTitle("");
  };

  const openEditDialog = (feed: Feed) => {
    setEditingFeed(feed);
    setEditTitle(feed.customTitle || feed.title);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="py-4">
          <div className="px-4 mb-6">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {/* Square icon with rounded corners matching favicon style */}
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <svg
                  className="w-5 h-5 text-primary-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 11a9 9 0 0 1 9 9" />
                  <path d="M4 4a16 16 0 0 1 16 16" />
                  <circle
                    cx="5"
                    cy="19"
                    r="1.5"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </div>
              Reader
            </h1>
          </div>

          <div className="px-4 mb-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2" size="sm">
                  <Plus className="w-4 h-4" /> Add Feed
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Feed</DialogTitle>
                  <VisuallyHidden>
                    <DialogDescription>
                      Add a new RSS feed by selecting from presets or entering a
                      custom URL
                    </DialogDescription>
                  </VisuallyHidden>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preset Feeds</label>
                    <Select onValueChange={handleAddDefault}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a feed source" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {ORGANIZED_FEEDS.map((category) => (
                          <SelectGroup key={category.category}>
                            <SelectLabel className="font-bold text-primary">
                              {category.category}
                            </SelectLabel>
                            {category.sources.map((source) =>
                              source.sections.length === 1 ? (
                                <SelectItem
                                  key={source.sections[0].url}
                                  value={source.sections[0].url}
                                >
                                  {source.name}
                                </SelectItem>
                              ) : (
                                source.sections.map((section) => (
                                  <SelectItem
                                    key={section.url}
                                    value={section.url}
                                    className="pl-6"
                                  >
                                    <span className="text-muted-foreground">
                                      {source.name}
                                    </span>
                                    <span className="mx-1">›</span>
                                    <span>{section.name}</span>
                                  </SelectItem>
                                ))
                              )
                            )}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Feed URL</label>
                    <Input
                      placeholder="https://example.com/rss"
                      value={newFeedUrl}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Custom Title (optional)
                    </label>
                    <Input
                      placeholder="My Custom Feed Name"
                      value={newFeedTitle}
                      onChange={(e) => setNewFeedTitle(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddFeed} disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Feed"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-1 px-2 py-2">
            <Button
              variant={selectedFeedId === null ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setSelectedFeedId(null)}
            >
              <Inbox className="w-4 h-4" />
              All Articles
            </Button>
            <Separator className="my-2" />
            <h3 className="px-4 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Your Feeds
            </h3>
            {feeds.map((feed) => (
              <div key={feed.id} className="group flex items-center gap-1">
                <Button
                  variant={selectedFeedId === feed.id ? "secondary" : "ghost"}
                  className="w-full justify-start truncate text-sm font-normal"
                  onClick={() => setSelectedFeedId(feed.id!)}
                >
                  <span className="truncate">
                    {feed.customTitle || feed.title}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(feed);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (feed.id) removeFeed(feed.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="px-4 py-4 border-t space-y-4 mt-4 pb-6">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Clear Translation Model Cache Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2" size="sm">
                  <Languages className="w-4 h-4" />
                  Limpiar Modelo de Traducción
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Limpiar caché del modelo de traducción?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto eliminará el modelo de traducción descargado (~75MB).
                    Se volverá a descargar automáticamente cuando traduzcas un
                    artículo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await clearTranslationModelCache();
                        toast.success(
                          "Caché del modelo de traducción limpiada"
                        );
                      } catch (error) {
                        toast.error("Error al limpiar la caché");
                        console.error(error);
                      }
                    }}
                  >
                    Limpiar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Clear Cache Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2" size="sm">
                  <Trash className="w-4 h-4" />
                  Clear Cache
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all cached data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your RSS feeds and articles
                    from the local cache. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearCache}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear Cache
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </ScrollArea>

      {/* Edit Feed Dialog */}
      <Dialog
        open={!!editingFeed}
        onOpenChange={(open) => !open && setEditingFeed(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feed</DialogTitle>
            <VisuallyHidden>
              <DialogDescription>
                Change the display name for this feed
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Feed Title</label>
              <Input
                placeholder="Custom feed name"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Original: {editingFeed?.title}
              </label>
            </div>
            <Button onClick={handleEditFeed}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { BrandingBanner } from "@/components/BrandingBanner";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function AppShell({ children, feedState }: AppShellProps) {
  const {
    feeds,
    addNewFeed,
    removeFeed,
    updateFeedTitle,
    selectedFeedId,
    setSelectedFeedId,
    clearCache,
    isLoading,
  } = feedState;
  const [menuTop, setMenuTop] = useState<number | null>(null);

  useEffect(() => {
    const computeTop = () => {
      const rss = document.getElementById("rss-icon-container");
      if (rss) {
        const rect = rss.getBoundingClientRect();
        setMenuTop(rect.top);
      }
    };
    computeTop();
    window.addEventListener("resize", computeTop);
    window.addEventListener("scroll", computeTop, { passive: true });
    // Also listen for inner app scroll container scroll events
    const appScroll = document.getElementById("app-scroll");
    if (appScroll) {
      appScroll.addEventListener("scroll", computeTop, { passive: true });
    }
    // Also observe header transition events to recalc when height changes
    const header = document.querySelector(".sticky.top-0");
    if (header) {
      header.addEventListener("transitionend", computeTop);
    }
    // Fallback polling - recompute top periodically to guard against layout jitter
    const intervalId = setInterval(computeTop, 300);
    const observer = new MutationObserver(computeTop);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => {
      window.removeEventListener("resize", computeTop);
      window.removeEventListener("scroll", computeTop);
      if (appScroll) appScroll.removeEventListener("scroll", computeTop);
      if (header) header.removeEventListener("transitionend", computeTop);
      clearInterval(intervalId);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <BrandingBanner />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 border-r bg-muted/10 h-full">
          <SidebarContent
            feeds={feeds}
            selectedFeedId={selectedFeedId}
            setSelectedFeedId={setSelectedFeedId}
            removeFeed={removeFeed}
            addNewFeed={addNewFeed}
            updateFeedTitle={updateFeedTitle}
            clearCache={clearCache}
            isLoading={isLoading}
          />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              style={
                menuTop !== null
                  ? ({
                      position: "fixed",
                      left: "1rem",
                      top: `${menuTop}px`,
                    } as React.CSSProperties)
                  : undefined
              }
              className="md:hidden fixed left-4 z-50 bg-background/80 backdrop-blur-sm shadow-sm border transition-transform duration-200"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-64 flex flex-col overflow-hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden">
              <SidebarContent
                feeds={feeds}
                selectedFeedId={selectedFeedId}
                setSelectedFeedId={setSelectedFeedId}
                removeFeed={removeFeed}
                addNewFeed={addNewFeed}
                updateFeedTitle={updateFeedTitle}
                clearCache={clearCache}
                isLoading={isLoading}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {children}
        </main>
      </div>

      <footer className="border-t bg-background/5 text-sm text-center py-2">
        <div className="max-w-screen-lg mx-auto px-4">
          <a
            href="https://webcode.es"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Creado por webcode.es
          </a>
          <span className="mx-2">·</span>
          <a href="mailto:info@webcode.es" className="underline">
            info@webcode.es
          </a>
        </div>
      </footer>
    </div>
  );
}
