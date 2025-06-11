const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

async function getAllOutputs(token) {
  const cacheKey = 'all_outputs';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/outputs`, {
    params: { size: 10000 },
    headers: { Authorization: `Bearer ${token}` }
  });

  const outputDtos = (response.data._embedded.outputs || []).map(output => {
    const idMatch = output._links?.self?.href?.match(/\/(\d+)/);
    return {
      id: idMatch?.[1] || null,
      ...output
    };
  });

  await setCache(cacheKey, outputDtos, 60); // TTL 60 detik
  return outputDtos;
}

module.exports = { getAllOutputs };
