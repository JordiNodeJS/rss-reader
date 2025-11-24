import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface Feed {
  id?: number;
  url: string;
  title: string;
  customTitle?: string; // User-defined title override
  description?: string;
  icon?: string;
  addedAt: number;
}

export interface Article {
  id?: number;
  feedId: number;
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  image?: string; // Article thumbnail/featured image
  content?: string;
  contentSnippet?: string;
  scrapedContent?: string; // Full HTML content from scraping
  isRead: boolean;
  isSaved: boolean; // Explicitly saved by user
  fetchedAt: number;
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
  }
  return dbPromise;
};

// Feed Operations
export const addFeed = async (feed: Omit<Feed, "id">) => {
  const db = await getDB();
  return db.add("feeds", feed);
};

export const getAllFeeds = async () => {
  const db = await getDB();
  return db.getAll("feeds");
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

// Clear all data
export const clearAllData = async () => {
  const db = await getDB();
  const tx = db.transaction(["feeds", "articles"], "readwrite");
  await tx.objectStore("feeds").clear();
  await tx.objectStore("articles").clear();
  await tx.done;
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
