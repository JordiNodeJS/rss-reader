import fs from "fs";
import { Redis } from "@upstash/redis";

// Configuration
const IP = process.env.TEST_IP || "5.6.7.8";
const TIMES = parseInt(process.env.TEST_TIMES || "3");

// Read .env.local for Upstash creds if env vars not set
let url = process.env.UPSTASH_REDIS_REST_URL;
let token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  const envRaw = fs.readFileSync(".env.local", "utf8");
  const urlMatch = envRaw.match(/^UPSTASH_REDIS_REST_URL\s*=\s*"?(.*?)"?$/m);
  const tokenMatch = envRaw.match(
    /^UPSTASH_REDIS_REST_TOKEN\s*=\s*"?(.*?)"?$/m
  );
  if (urlMatch && tokenMatch) {
    url = url || urlMatch[1];
    token = token || tokenMatch[1];
  }
}

if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN");
  process.exit(2);
}

const redis = new Redis({ url, token });

const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1h
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

async function simulateRequest(ip) {
  const key = `ratelimit:summarize:${ip}`;
  const now = Date.now();

  // Try to get existing entry
  let entry = await redis.get(key);

  if (!entry || entry.resetAt < now) {
    const newEntry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    await redis.set(key, newEntry, { ex: RATE_LIMIT_WINDOW_SECONDS });
    return {
      allowed: true,
      remaining: RATE_LIMIT_REQUESTS - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  const remainingTTL = Math.ceil((entry.resetAt - now) / 1000);
  await redis.set(key, entry, { ex: remainingTTL > 0 ? remainingTTL : 1 });
  return {
    allowed: true,
    remaining: RATE_LIMIT_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

(async () => {
  try {
    console.log(`Simulating ${TIMES} requests from IP ${IP}...`);
    for (let i = 1; i <= TIMES; i++) {
      const res = await simulateRequest(IP);
      console.log(`Attempt ${i}:`, res);
    }

    // Read final value
    const key = `ratelimit:summarize:${IP}`;
    const final = await redis.get(key);
    console.log("Final stored value for", key, "=>", final);

    // Show TTL via REST 'ttl' endpoint isn't available directly in SDK; we approximate by re-setting and reading remaining TTL via GET (Upstash SDK returns TTL on GET? If not, show value only.)

    process.exit(0);
  } catch (err) {
    console.error("Error during simulation:", err);
    process.exit(1);
  }
})();
