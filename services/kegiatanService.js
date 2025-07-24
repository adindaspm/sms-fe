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
  const progress = (( statusTahap.tahap1Percentage * 6 + statusTahap.tahap2Percentage * 6 + statusTahap.tahap3Percentage * 7 + statusTahap.tahap4Percentage * 4 + 
    statusTahap.tahap5Percentage * 8 + statusTahap.tahap6Percentage * 5 + statusTahap.tahap7Percentage * 5 + statusTahap.tahap8Percentage * 3 ) / 44 ).toFixed(2)
  kegiatan = {
    id: id,
    ...kegiatan,
    statusTahap,
    progress
  };

  await setCache(cacheKey, kegiatan, 60); // TTL 60 detik
  return kegiatan;
}

async function getStatisticsDirektorat(token){
  const cacheKey = `statisticsDirektorat`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  
  const response = await axios.get(`${apiBaseUrl}/api/kegiatans/statistics/direktorat`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

  let statisticsDirektorat = response.data;

  await setCache(cacheKey, statisticsDirektorat, 60); // TTL 60 detik
  return statisticsDirektorat;
}

async function getStatisticsDeputi(token){
  const cacheKey = `statisticsDeputi`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  
  const response = await axios.get(`${apiBaseUrl}/api/kegiatans/statistics/deputi`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

  let statisticsDeputi = response.data;

  await setCache(cacheKey, statisticsDeputi, 60); // TTL 60 detik
  return statisticsDeputi;
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

module.exports = { getAllKegiatans, getKegiatanById, getStatusTahapByKegiatanId, getStatisticsDeputi, getStatisticsDirektorat, getFileTahapByKegiatanId };
