const axios = require('axios');
const { getCache, setCache, delCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

async function getAllOutputs(token) {
  const cacheKey = 'all_outputs';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/api/outputs`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const outputDtos = response.data;

  await setCache(cacheKey, outputDtos, 60); // TTL 60 detik
  return outputDtos;
}

async function getOutputsByProgramId(programId, token) {
  const cacheKey = `outputsByProgram_${programId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${apiBaseUrl}/programs/${programId}/listOutputs`, {
      headers: { 
        Authorization: `Bearer ${token}` },
    });

    const data = response.data._embedded?.outputs || [];
    const outputs = data.map((o) => {
      const selfHref = o._links?.self?.href || '';
      const idMatch = selfHref.match(/\/outputs\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        name: o.name,
        code: o.code,
        year: o.year,
      };
    });

    if (outputs.length > 0) {
      await setCache(cacheKey, outputs, 60);
    }
    return outputs;
  } catch (error) {
    console.error("Error di getOutputsByProgramId:", error.message);
    return null;
  }
}

module.exports = { getAllOutputs, getOutputsByProgramId };
