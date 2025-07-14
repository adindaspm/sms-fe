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

  const satkerDtos = await Promise.all((response.data._embedded.satkers || []).map(async satker => {
    const idMatch = satker._links?.self?.href?.match(/\/(\d+)/);
    const id = idMatch?.[1] || null;

    return {
      id,
      ...satker,
      province: {
        code: satker.code.substring (0,2)
      }
    };
  }));
  
  await setCache(cacheKey, satkerDtos, 60 * 60); // TTL 60 menit
  return satkerDtos;
}

async function getSatkerById(id, token) {
  const cacheKey = `satker_${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/satkers/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });

  let satker = response.data;

  // Ambil juga province
  const province = await getProvinceBySatkerId(id, token);

  satker = {
    id,
    ...satker,
    province
  };

  await setCache(cacheKey, satker, 60);
  return satker;
}

async function getProvinceBySatkerId(satkerId, token) {
  try {
    const cacheKey = `provinceBySatker_${satkerId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const response = await axios.get(`${apiBaseUrl}/satkers/${satkerId}/province`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    // Ambil field name dan code saja dari responsenya
    const { name, code, _links } = response.data;

    const href = _links?.self?.href || '';
    const matches = href.match(/\/provinces\/(\d+)/); // ambil angka setelah "/provinces/"
    const id = matches ? parseInt(matches[1]) : null;

    const province = { id, name, code };

    await setCache(cacheKey, province, 60*60);
    return province;
  } catch (err) {
    console.error(`Gagal ambil province untuk satkerId ${satkerId}:`, err.message);
    return null; // supaya tidak crash kalau gagal
  }
}

async function getSatkerIdByName(query, token) {
  try {
    const sanitizedName = query.replace(/^Badan Pusat Statistik\s*/, '');
    const response = await axios.get(`http://localhost/satkers/search/searchSatker?query=${sanitizedName}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let satkers = response.data._embedded.satkers;
    satkers = satkers.map(satker => {
      const href = satker._links?.self?.href || '';
      const idMatch = href.match(/\/satkers\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        href,
        id,
        ...satker
      };
    });

    if (satkers.length > 0) {
      return satkers[0].id;
    } else {
      throw new Error('Satker tidak ditemukan');
    }
  } catch (error) {
    console.error('Error mencari Satker:', error.message);
    throw error;
  }
}

module.exports = { getAllSatkers, getSatkerById, getProvinceBySatkerId, getSatkerIdByName };
