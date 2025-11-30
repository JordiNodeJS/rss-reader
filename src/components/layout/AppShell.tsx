"use client";

// Created by webcode.es
// Contact: info@webcode.es

import {
  useEffect,
  useState,
  lazy,
  Suspense,
  useSyncExternalStore,
} from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Trash2, Inbox, Trash, Pencil } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useFeeds } from "@/hooks/useFeeds";
import { getDBEvents, clearDBEvents } from "@/lib/db-monitor";
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
import { MarqueeText } from "@/components/ui/marquee-text";
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
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// Lazy load CacheManager - heavy component with model management
const CacheManager = lazy(() =>
  import("@/components/CacheManager").then((mod) => ({
    default: mod.CacheManager,
  }))
);

// ============================================================
// SIDEBAR CONFIGURATION - Change these values to adjust sidebar
// ============================================================
const SIDEBAR_CONFIG = {
  /** Default width in pixels (used for SSR and initial render) */
  DEFAULT_WIDTH: 320,
  /** Minimum width the sidebar can be resized to */
  MIN_WIDTH: 260,
  /** Maximum width the sidebar can be resized to */
  MAX_WIDTH: 600,
  /** Mobile sidebar width */
  MOBILE_WIDTH: 288,
} as const;

// ============================================================
// Hydration-safe client detection hook
// Uses useSyncExternalStore to avoid hydration mismatches
// See: https://react.dev/reference/react/useSyncExternalStore
// ============================================================
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hook to detect client-side rendering without hydration issues.
 * Returns false during SSR and initial hydration, true after hydration.
 */
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}

interface AppShellProps {
  children: React.ReactNode;
  feedState: ReturnType<typeof useFeeds>;
  initialSidebarWidth?: number;
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
          { name: "Política", url: "https://www.eldiario.es/rss/politica/" },
          { name: "Economía", url: "https://www.eldiario.es/rss/economia/" },
          { name: "Sociedad", url: "https://www.eldiario.es/rss/sociedad/" },
          {
            name: "Internacional",
            url: "https://www.eldiario.es/rss/internacional/",
          },
          { name: "Cultura", url: "https://www.eldiario.es/rss/cultura/" },
          {
            name: "Tecnología",
            url: "https://www.eldiario.es/rss/tecnologia/",
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
          {
            name: "Portada",
            url: "https://www.rtve.es/rss/temas_noticias.xml",
          },
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
      {
        name: "Liberation",
        sections: [
          {
            name: "Société",
            url: "https://www.liberation.fr/arc/outboundfeeds/rss-all/category/societe/?outputType=xml",
          },
        ],
      },
    ],
  },
];

// Flatten for backwards compatibility where needed
const DEFAULT_FEEDS = ORGANIZED_FEEDS.flatMap((category) =>
  (category.sources || []).flatMap((source) =>
    (source.sections || []).map((section) => ({
      name:
        (source.sections || []).length > 1
          ? `${source.name} - ${section.name}`
          : source.name,
      url: section.url,
    }))
  )
);

interface SortableFeedItemProps {
  feed: Feed;
  selectedFeedId: number | null;
  setSelectedFeedId: (id: number | null) => void;
  openEditDialog: (feed: Feed) => void;
  removeFeed: (id: number) => void;
}

function SortableFeedItem({
  feed,
  selectedFeedId,
  setSelectedFeedId,
  openEditDialog,
  removeFeed,
}: SortableFeedItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feed.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative flex items-center px-1 mb-1"
    >
      <Button
        variant={selectedFeedId === feed.id ? "secondary" : "ghost"}
        className="w-full justify-start text-sm font-normal pr-20 overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={() => setSelectedFeedId(feed.id!)}
      >
        <MarqueeText
          text={feed.customTitle || feed.title}
          className="flex-1 text-left"
        />
      </Button>
      <div className="absolute right-5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            openEditDialog(feed);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            if (feed.id) removeFeed(feed.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  feeds: Feed[];
  selectedFeedId: number | null;
  setSelectedFeedId: (id: number | null) => void;
  removeFeed: (id: number) => void;
  addNewFeed: (url: string, customTitle?: string) => Promise<void>;
  updateFeedTitle: (id: number, customTitle: string) => Promise<void>;
  clearCache: () => Promise<void>;
  reorderFeeds: (feeds: Feed[]) => Promise<void>;
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
  reorderFeeds,
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = feeds.findIndex((f) => f.id === active.id);
      const newIndex = feeds.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFeeds = arrayMove(feeds, oldIndex, newIndex);
        reorderFeeds(newFeeds);
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden min-w-0">
      <ScrollArea className="h-full w-full">
        <div className="py-4 pr-8">
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
                  <Plus className="w-4 h-4" /> Añadir feed
                </Button>
              </DialogTrigger>
              <DialogContent id="dialog-add-feed">
                <DialogHeader>
                  <DialogTitle>Añadir nuevo feed</DialogTitle>
                  <VisuallyHidden>
                    <DialogDescription>
                      Añade un nuevo feed RSS seleccionando de los
                      preestablecidos o introduciendo una URL personalizada
                    </DialogDescription>
                  </VisuallyHidden>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Feeds preestablecidos
                    </label>
                    <Select onValueChange={handleAddDefault}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una fuente" />
                      </SelectTrigger>
                      <SelectContent
                        id="select-addfeed-presets"
                        className="max-h-80"
                      >
                        {ORGANIZED_FEEDS.map((category) => (
                          <SelectGroup key={category.category}>
                            <SelectLabel className="font-bold text-primary">
                              {category.category}
                            </SelectLabel>
                            {(category.sources || []).map((source) =>
                              (source.sections || []).length === 1 ? (
                                <SelectItem
                                  key={source.sections?.[0]?.url}
                                  value={source.sections?.[0]?.url || ""}
                                >
                                  {source.name}
                                </SelectItem>
                              ) : (
                                (source.sections || []).map((section) => (
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
                    <label className="text-sm font-medium">URL del feed</label>
                    <Input
                      placeholder="https://ejemplo.com/rss"
                      value={newFeedUrl}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Título personalizado (opcional)
                    </label>
                    <Input
                      placeholder="Mi feed personalizado"
                      value={newFeedTitle}
                      onChange={(e) => setNewFeedTitle(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddFeed} disabled={isLoading}>
                    {isLoading ? "Añadiendo..." : "Añadir feed"}
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
              Todos los artículos
            </Button>
            <Separator className="my-2" />
            <h3 className="px-4 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Tus feeds
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={feeds.map((f) => f.id!)}
                strategy={verticalListSortingStrategy}
              >
                {(feeds || []).map((feed) => (
                  <SortableFeedItem
                    key={feed.id}
                    feed={feed}
                    selectedFeedId={selectedFeedId}
                    setSelectedFeedId={setSelectedFeedId}
                    openEditDialog={openEditDialog}
                    removeFeed={removeFeed}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <div className="px-2 py-4 border-t space-y-4 mt-4 pb-32">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Clear Translation Model Cache Button - Lazy loaded */}
            <Suspense
              fallback={
                <Button variant="outline" size="sm" className="w-full" disabled>
                  <span className="animate-pulse">Cargando...</span>
                </Button>
              }
            >
              <CacheManager />
            </Suspense>

            {/* View DB Events (dev/debug) */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full max-w-full gap-2"
                  size="sm"
                >
                  <span className="truncate">Ver eventos de BD</span>
                </Button>
              </DialogTrigger>
              <DialogContent id="dialog-db-events">
                <DialogHeader>
                  <DialogTitle>Registro de eventos IndexedDB</DialogTitle>
                  <DialogDescription>
                    Muestra los eventos recientes de IndexedDB detectados por el
                    monitor.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-2">
                  <pre className="whitespace-pre-wrap break-words max-w-full max-h-60 overflow-auto text-xs bg-muted p-2 rounded">
                    {JSON.stringify(getDBEvents(), null, 2)}
                  </pre>
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      try {
                        clearDBEvents();
                        toast.success("Registro de eventos limpiado");
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    Limpiar registro
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Clear Cache Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full max-w-full gap-2"
                  size="sm"
                >
                  <Trash className="w-4 h-4 shrink-0" />
                  <span className="truncate">Limpiar caché</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent id="alert-clear-cache">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Limpiar todos los datos en caché?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto eliminará permanentemente todos tus feeds RSS y
                    artículos de la caché local. Esta acción no se puede
                    deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearCache}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Limpiar caché
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
        <DialogContent id="dialog-edit-feed">
          <DialogHeader>
            <DialogTitle>Editar feed</DialogTitle>
            <VisuallyHidden>
              <DialogDescription>
                Cambia el nombre de este feed
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título del feed</label>
              <Input
                placeholder="Nombre personalizado"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Original: {editingFeed?.title}
              </label>
            </div>
            <Button onClick={handleEditFeed}>Guardar cambios</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { BrandingBanner } from "@/components/BrandingBanner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { startDBWatch, stopDBWatch } from "@/lib/db-monitor";

export function AppShell({
  children,
  feedState,
  initialSidebarWidth,
}: AppShellProps) {
  const {
    feeds,
    addNewFeed,
    removeFeed,
    updateFeedTitle,
    selectedFeedId,
    setSelectedFeedId,
    clearCache,
    reorderFeeds,
    isLoading,
  } = feedState;
  const [menuTop, setMenuTop] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  // Use centralized SIDEBAR_CONFIG for default width.
  // Read from localStorage/cookie in a client-only effect to avoid hydration mismatches.
  const [sidebarWidth, setSidebarWidth] = useState<number>(
    () => initialSidebarWidth ?? SIDEBAR_CONFIG.DEFAULT_WIDTH
  );
  const [isResizing, setIsResizing] = useState(false);
  const isClient = useIsClient();

  useEffect(() => {
    // Start an indexedDB monitor on client to detect deletions and log them
    startDBWatch({
      dbNames: ["rss-reader-db"],
      onEvent: (e) => {
        console.warn("DB Monitor Event:", e);
        // Notify user in the UI (non-intrusive) — devs can see console and localStorage logs
        if (e.type === "deleted") {
          try {
            toast.warning(`IndexedDB ${e.name} eliminada`);
          } catch {}
        }
      },
    });
    return () => stopDBWatch();
  }, []);

  // On mount, read cookie first (server uses cookie to render initial width),
  // fall back to localStorage if cookie is not present. Wrap this logic in a
  // client-only effect so we don't run DOM APIs during render.
  useEffect(() => {
    // fall back to localStorage if cookie is not present.
    if (typeof window !== "undefined") {
      const cookieMatch = document.cookie.match(
        /(^|;)\s*sidebar-width=([^;]+)/
      );
      const cookieValue = cookieMatch ? parseInt(cookieMatch[2], 10) : NaN;
      if (!Number.isNaN(cookieValue)) {
        // Use requestAnimationFrame to avoid synchronous setState within effect
        requestAnimationFrame(() =>
          setSidebarWidth(
            Math.min(
              Math.max(cookieValue, SIDEBAR_CONFIG.MIN_WIDTH),
              SIDEBAR_CONFIG.MAX_WIDTH
            )
          )
        );
      } else {
        const saved = localStorage.getItem("sidebar-width");
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!Number.isNaN(parsed))
            requestAnimationFrame(() => setSidebarWidth(parsed));
        }
      }
    }

    const computeTop = () => {
      const rss = document.getElementById("rss-icon-container");
      if (rss) {
        const rect = rss.getBoundingClientRect();
        // Position menu button below the RSS icon to avoid overlap on mobile
        // Add the icon height plus a small gap (8px)
        setMenuTop(rect.bottom + 8);
      }

      const appScroll = document.getElementById("app-scroll");
      if (appScroll) {
        setIsScrolled(appScroll.scrollTop > 20);
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

  // Resize handler
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      // Constrain width between MIN_WIDTH and MAX_WIDTH from SIDEBAR_CONFIG
      const constrainedWidth = Math.min(
        Math.max(newWidth, SIDEBAR_CONFIG.MIN_WIDTH),
        SIDEBAR_CONFIG.MAX_WIDTH
      );
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Save to localStorage
      localStorage.setItem("sidebar-width", sidebarWidth.toString());
      // Also persist via cookie so server can render the same width on first paint
      try {
        document.cookie = `sidebar-width=${sidebarWidth}; path=/; max-age=${
          60 * 60 * 24 * 365
        }; SameSite=Lax`;
      } catch {
        /* ignore cookie write failures */
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Add cursor style to body during resize
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, sidebarWidth]);

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <BrandingBanner isScrolled={isScrolled} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {/* 
          For hydration safety: Apply dynamic width only on client.
          Server renders with DEFAULT_WIDTH via CSS variable, client updates after hydration.
          This prevents hydration mismatches when user has stored a custom width.
        */}
        <aside
          className="hidden md:block border-r bg-muted/10 h-full overflow-hidden relative group"
          style={
            isClient
              ? {
                  width: `${sidebarWidth}px`,
                  minWidth: `${sidebarWidth}px`,
                  maxWidth: `${sidebarWidth}px`,
                }
              : {
                  width: `${SIDEBAR_CONFIG.DEFAULT_WIDTH}px`,
                  minWidth: `${SIDEBAR_CONFIG.DEFAULT_WIDTH}px`,
                  maxWidth: `${SIDEBAR_CONFIG.DEFAULT_WIDTH}px`,
                }
          }
        >
          <SidebarContent
            feeds={feeds}
            selectedFeedId={selectedFeedId}
            setSelectedFeedId={setSelectedFeedId}
            removeFeed={removeFeed}
            addNewFeed={addNewFeed}
            updateFeedTitle={updateFeedTitle}
            clearCache={clearCache}
            reorderFeeds={reorderFeeds}
            isLoading={isLoading}
          />
          {/* Resize Indicator */}
          <div
            className="absolute right-0 top-0 h-full w-1 cursor-ew-resize z-10 flex items-center justify-center transition-all duration-200 hover:w-2"
            aria-label="Redimensionar barra lateral"
            onMouseDown={handleResizeStart}
            role="separator"
            aria-orientation="vertical"
          >
            {/* Visible indicator line */}
            <div className="h-12 w-1 rounded-full bg-primary/20 group-hover:bg-primary/40 group-hover:h-16 transition-all duration-200 shadow-sm pointer-events-none" />
          </div>
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
            id="sheet-mobile-nav"
            side="left"
            className="p-0 flex flex-col overflow-hidden"
            style={{ width: `${SIDEBAR_CONFIG.MOBILE_WIDTH}px` }}
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
                reorderFeeds={reorderFeeds}
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
