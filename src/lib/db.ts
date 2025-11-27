import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface Feed {
  id?: number;
  url: string;
  title: string;
  customTitle?: string; // User-defined title override
  description?: string;
  icon?: string;
  addedAt: number;
  order?: number; // Display order
}

export interface Article {
  id?: number;
  feedId: number;
  feedTitle?: string; // Cached feed title for display
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  image?: string; // Article thumbnail/featured image
  content?: string;
  contentSnippet?: string;
  scrapedContent?: string; // Full HTML content from scraping
  categories?: string[]; // Article categories/tags from RSS
  isRead: boolean;
  isSaved: boolean; // Explicitly saved by user
  fetchedAt: number;
  // Translation fields
  translatedTitle?: string;
  translatedContent?: string;
  translationLanguage?: string; // Target language code, e.g., 'es'
  translatedAt?: number; // Timestamp when translated
  originalLanguage?: string; // Detected source language, e.g., 'en'
}

interface RSSDB extends DBSchema {
  feeds: {
    key: number;
    value: Feed;
    indexes: { "by-url": string };
  };
  articles: {
    key: number;
    value: Article;
    indexes: { "by-feed": number; "by-guid": string; "by-link": string };
  };
}

const DB_NAME = "rss-reader-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<RSSDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<RSSDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Feeds store
        if (!db.objectStoreNames.contains("feeds")) {
          const feedStore = db.createObjectStore("feeds", {
            keyPath: "id",
            autoIncrement: true,
          });
          feedStore.createIndex("by-url", "url", { unique: true });
        }

        // Articles store
        if (!db.objectStoreNames.contains("articles")) {
          const articleStore = db.createObjectStore("articles", {
            keyPath: "id",
            autoIncrement: true,
          });
          articleStore.createIndex("by-feed", "feedId");
          articleStore.createIndex("by-guid", "guid", { unique: true });
          articleStore.createIndex("by-link", "link", { unique: false }); // Some feeds might duplicate links
        }
      },
    });
    // Attach event listeners for monitoring if running in a browser
    dbPromise.then((db) => {
      if (typeof window !== "undefined" && db) {
        // versionchange is fired when DB is deleted/updated elsewhere
        db.addEventListener("versionchange", () => {
          try {
            // Dynamic import to avoid server-side crashes
            import("@/lib/db-monitor").then((m) => {
              try {
                m.logDBEvent({
                  type: "deleted",
                  name: DB_NAME,
                  message:
                    "IDB versionchange detected on open DB (possible delete or migration)",
                });
              } catch (_) {}
            });
          } catch (e) {
            console.warn(
              "db: failed to import db-monitor to log versionchange",
              e
            );
          }
        });
      }
    });
    // If openDB fails, try to log the error (client-side only)
    dbPromise.catch((err) => {
      if (typeof window !== "undefined") {
        try {
          import("./db-monitor").then((m) => {
            try {
              m.logDBEvent({
                type: "error",
                name: DB_NAME,
                message: `openDB failed: ${
                  (err as Error)?.message ?? String(err)
                }`,
              });
            } catch (_) {}
          });
        } catch {}
      }
    });
  }
  return dbPromise;
};

// Feed Operations
export const addFeed = async (feed: Omit<Feed, "id">) => {
  const db = await getDB();
  // Check if feed with same URL already exists
  const existing = await db.getFromIndex("feeds", "by-url", feed.url);
  if (existing) {
    // Return existing feed's id instead of throwing ConstraintError
    return existing.id;
  }
  
  // Get max order to append to end
  const allFeeds = await db.getAll("feeds");
  const maxOrder = allFeeds.reduce((max, f) => Math.max(max, f.order || 0), -1);
  const newFeed = { ...feed, order: maxOrder + 1 };
  
  return db.add("feeds", newFeed);
};

export const getFeedByUrl = async (url: string): Promise<Feed | undefined> => {
  const db = await getDB();
  return db.getFromIndex("feeds", "by-url", url);
};

export const getAllFeeds = async () => {
  const db = await getDB();
  const feeds = await db.getAll("feeds");
  return feeds.sort((a, b) => {
    // Sort by order if both have it
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // If one has order, it comes first (or last depending on preference, usually first)
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    // Fallback to ID or addedAt
    return (a.id || 0) - (b.id || 0);
  });
};

export const updateFeedsOrder = async (feeds: Feed[]) => {
  const db = await getDB();
  const tx = db.transaction("feeds", "readwrite");
  const store = tx.objectStore("feeds");
  await Promise.all(
    feeds.map((feed, index) => {
      const updatedFeed = { ...feed, order: index };
      return store.put(updatedFeed);
    })
  );
  await tx.done;
};

export const deleteFeed = async (id: number) => {
  const db = await getDB();
  await db.delete("feeds", id);
  // Also delete related articles
  const tx = db.transaction("articles", "readwrite");
  const index = tx.store.index("by-feed");
  let cursor = await index.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
};

// Article Operations
export const addArticle = async (article: Omit<Article, "id">) => {
  const db = await getDB();
  // Check if exists by guid
  const existing = await db.getFromIndex("articles", "by-guid", article.guid);
  if (existing) return existing.id;
  return db.add("articles", article);
};

export const getArticlesByFeed = async (feedId: number) => {
  const db = await getDB();
  return db.getAllFromIndex("articles", "by-feed", feedId);
};

export const getAllArticles = async () => {
  const db = await getDB();
  return db.getAll("articles");
};

export const updateArticleScrapedContent = async (
  id: number,
  content: string
) => {
  const db = await getDB();
  const article = await db.get("articles", id);
  if (!article) throw new Error("Article not found");
  article.scrapedContent = content;
  await db.put("articles", article);
};

// Update article translation
export const updateArticleTranslation = async (
  id: number,
  translatedTitle: string,
  translatedContent: string,
  targetLanguage: string = "es",
  originalLanguage: string = "en"
) => {
  const db = await getDB();
  const article = await db.get("articles", id);
  if (!article) throw new Error("Article not found");
  article.translatedTitle = translatedTitle;
  article.translatedContent = translatedContent;
  article.translationLanguage = targetLanguage;
  article.originalLanguage = originalLanguage;
  article.translatedAt = Date.now();
  await db.put("articles", article);
};

// Get article by ID
export const getArticleById = async (
  id: number
): Promise<Article | undefined> => {
  const db = await getDB();
  return db.get("articles", id);
};

// Clear all data
export const clearAllData = async () => {
  const db = await getDB();
  const tx = db.transaction(["feeds", "articles"], "readwrite");
  await tx.objectStore("feeds").clear();
  await tx.objectStore("articles").clear();
  await tx.done;
  // Try to log this action to db-monitor for debugging if running in the browser
  if (typeof window !== "undefined") {
    try {
      import("./db-monitor").then((m) => {
        try {
          m.logDBEvent({
            type: "deleted",
            name: DB_NAME,
            message: "clearAllData() invoked",
          });
        } catch (_) {}
      });
    } catch {
      // ignore dynamic import errors
    }
  }
};

// Update feed (e.g., custom title)
export const updateFeed = async (
  id: number,
  updates: Partial<Omit<Feed, "id">>
) => {
  const db = await getDB();
  const feed = await db.get("feeds", id);
  if (!feed) throw new Error("Feed not found");
  const updatedFeed = { ...feed, ...updates };
  await db.put("feeds", updatedFeed);
  return updatedFeed;
};

// Get feed by ID
export const getFeedById = async (id: number): Promise<Feed | undefined> => {
  const db = await getDB();
  return db.get("feeds", id);
};
