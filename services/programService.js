const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

async function getAllPrograms(token) {
  const cacheKey = 'all_programs';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/programs`, {
    params: { size: 10000 },
    headers: { Authorization: `Bearer ${token}` }
  });

  const programDtos = (response.data._embedded.programs || []).map(program => {
    const idMatch = program._links?.self?.href?.match(/\/(\d+)/);
    return {
      id: idMatch?.[1] || null,
      ...program
    };
  });

  await setCache(cacheKey, programDtos, 60); // TTL 60 detik
  return programDtos;
}

module.exports = { getAllPrograms };
