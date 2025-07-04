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

  const kegiatanDtos = await Promise.all(
    (response.data._embedded.kegiatans || []).map(async (kegiatan) => {
      const idMatch = kegiatan._links?.self?.href?.match(/\/(\d+)/);
      const id = idMatch?.[1] || null;
      const statusTahap = await getStatusTahapByKegiatanId(id, token);
      return {
        id,
        ...kegiatan,
        statusTahap
      };
    })
  );

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

async function getStatusTahapByKegiatanId(kegiatanId, token) {
  const cacheKey = `statusTahapByKegiatan_${kegiatanId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/api/tahap/${kegiatanId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const statusTahap = response.data;
  await setCache(cacheKey, statusTahap, 60); // TTL 60 detik
  return statusTahap;
}

module.exports = { getAllKegiatans, getKegiatanById, getStatusTahapByKegiatanId };
