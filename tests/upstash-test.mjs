import fs from "fs";
import { Redis } from "@upstash/redis";

// Read .env.local
const envRaw = fs.readFileSync(".env.local", "utf8");
const urlMatch = envRaw.match(/^UPSTASH_REDIS_REST_URL\s*=\s*"?(.*?)"?$/m);
const tokenMatch = envRaw.match(/^UPSTASH_REDIS_REST_TOKEN\s*=\s*"?(.*?)"?$/m);
if (!urlMatch || !tokenMatch) {
  console.error("UPSTASH env vars not found in .env.local");
  process.exit(2);
}
const url = urlMatch[1];
const token = tokenMatch[1];
console.log("Using Upstash URL:", url);

const redis = new Redis({ url, token });

(async () => {
  try {
    const testKey = `ratelimit:test:${Date.now()}`;
    await redis.set(
      testKey,
      { count: 1, resetAt: Date.now() + 3600 * 1000 },
      { ex: 60 }
    );
    console.log("Wrote test key:", testKey);
    const val = await redis.get(testKey);
    console.log("Read test key value:", val);
    // Cleanup
    await redis.del(testKey);
    console.log("Deleted test key, Upstash connectivity OK");
    process.exit(0);
  } catch (err) {
    console.error("Upstash test failed:", err);
    process.exit(1);
  }
})();
