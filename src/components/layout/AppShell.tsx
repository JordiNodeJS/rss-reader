"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Rss, Plus, Trash2, Inbox } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useFeeds } from '@/hooks/useFeeds';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Feed } from '@/lib/db';

interface AppShellProps {
  children: React.ReactNode;
  feedState: ReturnType<typeof useFeeds>;
}

const DEFAULT_FEEDS = [
  { name: 'El Diario', url: 'https://www.eldiario.es/rss/' },
  { name: 'La Vanguardia', url: 'https://www.lavanguardia.com/rss/home.xml' },
  { name: 'El País', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada' },
];

interface SidebarContentProps {
  feeds: Feed[];
  selectedFeedId: number | null;
  setSelectedFeedId: (id: number | null) => void;
  removeFeed: (id: number) => void;
  addNewFeed: (url: string) => Promise<void>;
  isLoading: boolean;
}

function SidebarContent({ feeds, selectedFeedId, setSelectedFeedId, removeFeed, addNewFeed, isLoading }: SidebarContentProps) {
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddFeed = async () => {
    if (!newFeedUrl) return;
    await addNewFeed(newFeedUrl);
    setNewFeedUrl('');
    setIsAddDialogOpen(false);
  };

  const handleAddDefault = (url: string) => {
    setNewFeedUrl(url);
  };

  return (
    <div className="flex flex-col h-full py-4">
      <div className="px-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Rss className="w-6 h-6 text-primary" />
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
              <Button onClick={handleAddFeed} disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Feed'}
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
                <span className="truncate">{feed.title}</span>
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
    </div>
  );
}

export function AppShell({ children, feedState }: AppShellProps) {
  const { feeds, addNewFeed, removeFeed, selectedFeedId, setSelectedFeedId, isLoading } = feedState;

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r bg-muted/10">
        <SidebarContent 
          feeds={feeds}
          selectedFeedId={selectedFeedId}
          setSelectedFeedId={setSelectedFeedId}
          removeFeed={removeFeed}
          addNewFeed={addNewFeed}
          isLoading={isLoading}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent 
            feeds={feeds}
            selectedFeedId={selectedFeedId}
            setSelectedFeedId={setSelectedFeedId}
            removeFeed={removeFeed}
            addNewFeed={addNewFeed}
            isLoading={isLoading}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}

