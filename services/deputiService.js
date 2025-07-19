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
    const response = await axios.get(`${apiBaseUrl}/deputis/${deputiId}/listDirektorats`, {
      headers: { 
        Authorization: `Bearer ${token}` },
    });

    const data = response.data._embedded?.direktorats || [];
    const direktorats = data.map((d) => {
      const selfHref = d._links?.self?.href || '';
      const idMatch = selfHref.match(/\/direktorats\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        name: d.name,
        code: d.code,
      };
    });

    if (direktorats.length > 0) {
      await setCache(cacheKey, direktorats, 60*60);
    }
    return direktorats;
  } catch (error) {
    console.error("Error di getDirektoratsByDeputiId:", error.message);
    return null;
  }
}

module.exports = { getAllDeputis, getDirektoratsByDeputiId };
