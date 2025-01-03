import NodeCache from "node-cache";

const trendingCache = new NodeCache({
  stdTTL: Number(process.env.CACHE_TTL) || 3600, // Default TTL: 1 hour
  checkperiod: 600, // Cleanup interval in seconds
});

export default trendingCache;
