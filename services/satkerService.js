const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

async function getAllSatkers(token) {
  const cacheKey = 'all_satkers';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/satkers`, {
    params: { size: 10000 },
    headers: { Authorization: `Bearer ${token}` }
  });

  const satkerDtos = (response.data._embedded.satkers || []).map(satker => {
    const idMatch = satker._links?.self?.href?.match(/\/(\d+)/);
    return {
      id: idMatch?.[1] || null,
      ...satker
    };
  });

  await setCache(cacheKey, satkerDtos, 60); // TTL 60 detik
  return satkerDtos;
}

async function getSatkerById(id, token) {
  const cacheKey = `satker_${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/satkers/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    let satker = response.data; // data kegiatan per ID
    satker = {
      id,
      ...satker
    }

  await setCache(cacheKey, satker, 60); // TTL 60 detik
  return satker;
}

module.exports = { getAllSatkers, getSatkerById };
