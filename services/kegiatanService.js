const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

const getAllKegiatans = async function (token) {
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
exports.getAllKegiatans = getAllKegiatans;

exports.getFilteredKegiatans = async function (direktoratId, satkerId, token) {
  const cacheKey = `kegiatansByDirektoratOrSatker_${direktoratId}_${satkerId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const kegiatans = await getAllKegiatansWithStatus(token);
  const filteredKegiatans = kegiatans.filter(k => {
    if (direktoratId) {
      return k.direktoratPjId === direktoratId;
    } else {
      return k.satkerId === satkerId;
    }
  });
  
  await setCache(cacheKey, filteredKegiatans, 60); // TTL 60 detik
  return filteredKegiatans;
}

exports.getKegiatanById = async function (id, token){
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

exports.getStatisticsDirektorat = async function (token){
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

exports.getStatisticsDeputi = async function (token){
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

const getStatusTahapByKegiatanId = async function (kegiatanId, token) {
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
exports.getStatusTahapByKegiatanId = getStatusTahapByKegiatanId;

exports.getFileTahapByKegiatanId = async function (kegiatanId, tahapId, token) {
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

exports.countByDirektorat = (kegiatans) => {
  return kegiatans.reduce((acc, k) => {
    const key = k.direktoratPjName || 'Tanpa Direktorat';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

exports.countByOutput = (kegiatans) => {
  return kegiatans.reduce((acc, k) => {
    const key = k.outputName || 'Tanpa Output';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

exports.countByProgram = (kegiatans) => {
  return kegiatans.reduce((acc, k) => {
    const key = k.programName || 'Tanpa Program';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

exports.countBySatker = (kegiatans) => {
  return kegiatans.reduce((acc, k) => {
    const key = k.satkerName || 'Tanpa Satker';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

exports.countByYear = (kegiatans) => {
  return kegiatans.reduce((acc, k) => {
    const year = new Date(k.startDate).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});
}

exports.countByMonth = (kegiatans) => {
  return kegiatans.reduce((acc, k) => {
    const date = new Date(k.startDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function getKategoriKegiatan(kegiatan) {
  const now = new Date();
  const start = new Date(kegiatan.startDate);
  const end = new Date(kegiatan.endDate);
  const status = kegiatan.statusTahap;

  if (status.tahap1Percentage === 0 && start > now) {
    return "Belum Mulai";
  }

  if (semuaTahapSelesai(status)) {
    return "Selesai";
  }

  if ((end < now && !semuaTahapSelesai(status)) || (start < now && semuaTahapKosong(status))) {
    return "Terlambat";
  }

  if (start <= now && !semuaTahapKosong(status) && !semuaTahapSelesai(status)) {
    return "Berjalan";
  }

  return "Tidak Diketahui";
}

exports.listKegiatanAkanDatang = (kegiatans, now = new Date()) => {
  return kegiatans.filter(k => new Date(k.startDate) > now);
}

const getAllKegiatansWithStatus = async (token) => {
  const cacheKey = 'kegiatans_with_status';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const kegiatans = await getAllKegiatans(token);

  const listWithStatus = await Promise.all(
    kegiatans.map(async k => {
      k.statusTahap = await getStatusTahapByKegiatanId(k.id, token);
      k.kategori = getKategoriKegiatan(k);
      return { ...k }; 
    })
  );

  await setCache(cacheKey, listWithStatus, 3600); // cache 2 menit
  return listWithStatus;
}
exports.getAllKegiatansWithStatus = getAllKegiatansWithStatus;

function semuaTahapSelesai(statusTahap) {
  return [1,2,3,4,5,6,7,8].every(i => statusTahap[`tahap${i}Percentage`] === 100);
}

function semuaTahapKosong(statusTahap) {
  return [1,2,3,4,5,6,7,8].every(i => statusTahap[`tahap${i}Percentage`] === 0);
}

exports.countKategoriStatus = async function (kegiatans) {
  const cacheKey = 'kategoriStatus';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const hasil = {
    belumMulai: 0,
    selesai: 0,
    terlambat: 0,
    berjalan: 0,
    tidakDiketahui: 0,
  };

  for (const kegiatan of kegiatans) {
    if (kegiatan.kategori === "Belum Mulai") hasil.belumMulai++;
    else if (kegiatan.kategori === "Selesai") hasil.selesai++;
    else if (kegiatan.kategori === "Terlambat") hasil.terlambat++;
    else if (kegiatan.kategori === "Berjalan") hasil.berjalan++;
    else hasil.tidakDiketahui++;
  }

  await setCache(cacheKey, hasil, 3600);
  return hasil;
}

function getTahapAktif(statusTahap) {
  for (let i = 1; i <= 8; i++) {
    const current = statusTahap[`tahap${i}Percentage`];
    const next = statusTahap[`tahap${i + 1}Percentage`] || 0;

    if (current > 0 && next === 0) {
      return i;
    }
  }
  return 0; // Tahap belum mulai sama sekali atau sudah selesai
}

const tahapKategoriMap = {
  1: "Specify Needs",
  2: "Design",
  3: "Build",
  4: "Collect",
  5: "Process",
  6: "Analyse",
  7: "Disseminate",
  8: "Evaluate",
};

exports.countByKategoriTahap = async function (kegiatans) {
  const hasil = {
    "Specify Needs": 0,
    "Design": 0,
    "Build": 0,
    "Collect": 0,
    "Process": 0,
    "Analyse": 0,
    "Disseminate": 0,
    "Evaluate": 0,
    "Belum Dimulai": 0,
    "Selesai": 0
  };

  for (const kegiatan of kegiatans) {
    const status = kegiatan.statusTahap;

    if (semuaTahapSelesai(status)) {
      hasil["Selesai"]++;
      continue;
    }

    if (semuaTahapKosong(status)) {
      hasil["Belum Dimulai"]++;
      continue;
    }

    const tahapAktif = getTahapAktif(status);
    const kategori = tahapKategoriMap[tahapAktif];

    if (kategori) {
      hasil[kategori]++;
    }
  }

  return hasil;
}

