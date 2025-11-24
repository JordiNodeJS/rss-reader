"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Rss, Plus, Trash2, Inbox, Trash, Pencil } from "lucide-react";
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
  SelectItem,
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

interface AppShellProps {
  children: React.ReactNode;
  feedState: ReturnType<typeof useFeeds>;
}

const DEFAULT_FEEDS = [
  { name: "El Diario", url: "https://www.eldiario.es/rss/" },
  { name: "La Vanguardia", url: "https://www.lavanguardia.com/rss/home.xml" },
  {
    name: "El País",
    url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",
  },
];

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
    <div className="flex flex-col h-full py-4">
      <div className="px-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
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
                    <SelectValue placeholder="Select a popular feed" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_FEEDS.map((feed) => (
                      <SelectItem key={feed.url} value={feed.url}>
                        {feed.name}
                      </SelectItem>
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

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 p-2">
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
      </ScrollArea>

      <div className="px-4 py-4 border-t">
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
          <SheetContent side="left" className="p-0 w-64">
            <SheetHeader>
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden>
            </SheetHeader>
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
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
