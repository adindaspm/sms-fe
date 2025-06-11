// utils/cacheService.js

const NodeCache = require("node-cache");
const nodeCache = new NodeCache({ stdTTL: 60 }); // 60 detik

let redisClient;
let redisAvailable = false;
let hasLoggedRedisError = false; // hindari spam log

(async () => {
  try {
    const redis = require("redis");
    redisClient = redis.createClient();

    // Pasang listener SEBELUM connect
    redisClient.on("error", (err) => {
      if (!hasLoggedRedisError) {
        console.warn("❌ Redis connection error:", err?.message);
        hasLoggedRedisError = true;
      }
      redisAvailable = false;
    });

    redisClient.on("connect", () => {
      console.log("🔌 Connecting to Redis...");
    });

    redisClient.on("ready", () => {
      console.log("✅ Redis connected and ready!");
      redisAvailable = true;
      hasLoggedRedisError = false;
    });

    await redisClient.connect();
  } catch (err) {
    if (!hasLoggedRedisError) {
      console.warn("❌ Redis not available, fallback to node-cache:", err?.message);
      hasLoggedRedisError = true;
    }
    redisAvailable = false;
  }
})();

// Wrapper fungsi get/set cache
async function getCache(key) {
  if (redisAvailable && redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn("Redis GET failed, fallback to node-cache");
    }
  }
  return nodeCache.get(key) || null;
}

async function setCache(key, value, ttl = 60) {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttl });
      return;
    } catch (err) {
      console.warn("Redis SET failed, fallback to node-cache");
    }
  }
  nodeCache.set(key, value, ttl);
}

async function delCache(key) {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn("Redis DEL failed, fallback to node-cache");
      nodeCache.del(key);
    }
  } else {
    nodeCache.del(key);
  }
}

module.exports = {
  getCache,
  setCache,
  delCache,
};
