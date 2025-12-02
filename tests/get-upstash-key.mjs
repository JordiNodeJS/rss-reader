import fs from "fs";
import { Redis } from "@upstash/redis";

const KEY = process.env.KEY || "ratelimit:summarize:5.6.7.8";

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
  console.error("Missing UPSTASH env vars");
  process.exit(2);
}

const redis = new Redis({ url, token });

(async () => {
  try {
    const val = await redis.get(KEY);
    console.log("Key:", KEY);
    console.log("Raw value:");
    console.log(JSON.stringify(val, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Error reading key:", err);
    process.exit(1);
  }
})();
