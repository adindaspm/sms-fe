const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

async function getAllKegiatans(token) {
  const cacheKey = 'all_kegiatans';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/api/kegiatans`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const kegiatanDtos = (response.data || []);

  await setCache(cacheKey, kegiatanDtos, 60); // TTL 60 detik
  return kegiatanDtos;
}

async function getKegiatanById(id, token){
  const cacheKey = `kegiatan_${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  
  const response = await axios.get(`${apiBaseUrl}/api/kegiatans/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

  let kegiatan = response.data; // data kegiatan per ID
  const statusTahap = await getStatusTahapByKegiatanId(id,token);
  const progress = ( statusTahap.tahap1Percentage + statusTahap.tahap2Percentage + statusTahap.tahap3Percentage + statusTahap.tahap4Percentage + 
    statusTahap.tahap5Percentage + statusTahap.tahap6Percentage + statusTahap.tahap7Percentage + statusTahap.tahap8Percentage ) / 8
  kegiatan = {
    id: id,
    ...kegiatan,
    statusTahap,
    progress
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

async function getFileTahapByKegiatanId(kegiatanId, tahapId, token) {
  // Ambil nama file
  const response = await axios.get(`${apiBaseUrl}/api/tahap/${kegiatanId}/${tahapId}/files`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const files = response.data;

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('Tidak ada file ditemukan');
  }

  const latestFileName = files[files.length - 1]; // Ambil yang paling akhir

  // Stream file dari API eksternal
  const downloadResponse = await axios.get(`${apiBaseUrl}/api/tahap/${kegiatanId}/${tahapId}/files/${latestFileName}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    responseType: 'stream'
  });

  return { stream: downloadResponse.data, latestFileName };
}

module.exports = { getAllKegiatans, getKegiatanById, getStatusTahapByKegiatanId, getFileTahapByKegiatanId };
