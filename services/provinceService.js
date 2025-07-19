const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

async function getAllProvinces(token) {
  const cacheKey = 'all_provinces';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/api/provinces`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const provinceDtos = (response.data || []);

  await setCache(cacheKey, provinceDtos, 60); // TTL 60 detik
  return provinceDtos;
}

async function getSatkersByProvince(id, token){
  const cacheKey = `satkersByProvince_${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/provinces/${id}/listSatkers`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  let satkerDtos = response.data._embedded.satkers || [];
  
  satkerDtos = satkerDtos.map(satker => {
    const href = satker._links?.self?.href || '';
    const idMatch = href.match(/\/satkers\/(\d+)/);
    const id = idMatch ? idMatch[1] : null;
  
    return {
      id,
      code: satker.code,
      name: satker.name,
      email: satker.email
    };
  });

  await setCache(cacheKey, satkerDtos, 60); // TTL 60 detik
  return satkerDtos;
}

module.exports = { getAllProvinces, getSatkersByProvince };
