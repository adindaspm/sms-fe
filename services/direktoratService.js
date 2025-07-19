const axios = require('axios');
const { getCache, setCache, delCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

async function getAllDirektorats(token) {
  const cacheKey = 'all_direktorats';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/api/direktorats`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const direktoratDtos = response.data;

  await setCache(cacheKey, direktoratDtos, 60*60);
  return direktoratDtos;
}

async function getDeputiByDirektoratId(direktoratId, token) {
  const cacheKey = `deputiByDirektorat_${direktoratId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${apiBaseUrl}/direktorats/${direktoratId}/deputi`, {
      headers: { 
        Authorization: `Bearer ${token}` },
    });

    const { name, code, _links } = response.data;

    const href = _links?.self?.href || '';
    const matches = href.match(/\/deputis\/(\d+)/);
    const id = matches ? parseInt(matches[1]) : null;

    const deputi = { id, name, code };

    await setCache(cacheKey, deputi, 60*60);
    return deputi;
  } catch (error) {
    console.error("Error di getDeputiByDirektoratId:", error.message);
    return null;
  }
}

module.exports = { getAllDirektorats, getDeputiByDirektoratId };
