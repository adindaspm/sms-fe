const axios = require('axios');
const { getCache, setCache, delCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

async function getAllDeputis(token) {
  const cacheKey = 'all_deputis';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/api/deputis`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const deputiDtos = response.data;

  await setCache(cacheKey, deputiDtos, 60*60);
  return deputiDtos;
}

async function getDirektoratsByDeputiId(deputiId, token) {
  const cacheKey = `direktoratsByDeputi_${deputiId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${apiBaseUrl}/api/direktorats/deputi/${deputiId}`, {
      headers: { 
        Authorization: `Bearer ${token}` },
    });

    const direktorats = response.data;
    
    await setCache(cacheKey, direktorats, 60*60);
    
    return direktorats;
  } catch (error) {
    console.error("Error di getDirektoratsByDeputiId:", error.message);
    return null;
  }
}

module.exports = { getAllDeputis, getDirektoratsByDeputiId };
