const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

async function getAllKegiatans(token) {
  const cacheKey = 'all_kegiatans';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/kegiatans`, {
    params: { size: 10000 },
    headers: { Authorization: `Bearer ${token}` }
  });

  const kegiatanDtos = (response.data._embedded.kegiatans || []).map(kegiatan => {
    const idMatch = kegiatan._links?.self?.href?.match(/\/(\d+)/);
    return {
      id: idMatch?.[1] || null,
      ...kegiatan
    };
  });

  await setCache(cacheKey, kegiatanDtos, 60); // TTL 60 detik
  return kegiatanDtos;
}

async function getKegiatanById(id, token){
  const cacheKey = `kegiatan_${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  
  const response = await axios.get(`${apiBaseUrl}/kegiatans/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

  let kegiatan = response.data; // data kegiatan per ID
  
  kegiatan = {
    id: id,
    ...kegiatan
  };

  await setCache(cacheKey, kegiatan, 60); // TTL 60 detik
  return kegiatan;
}

module.exports = { getAllKegiatans, getKegiatanById };
