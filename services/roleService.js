const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

async function getAllRoles(token) {
  const cacheKey = 'all_roles';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/roles`, {
    params: { size: 10000 },
    headers: { Authorization: `Bearer ${token}` }
  });

  const roleDtos = (response.data._embedded.roles || []).map(role => {
    const idMatch = role._links?.self?.href?.match(/\/(\d+)/);
    return {
      id: idMatch?.[1] || null,
      ...role
    };
  });

  await setCache(cacheKey, roleDtos, 60); // TTL 60 detik
  return roleDtos;
}

async function getUsersByRole(id,token){
  const cacheKey = `usersByRole_${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/roles/${id}/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  let userDtos = response.data._embedded.users || [];

  userDtos = userDtos.map(user => {
    const href = user._links?.self?.href || '';
    const idMatch = href.match(/\/users\/(\d+)/);
    const id = idMatch ? idMatch[1] : null;

    return {
      id,
      name: user.name,
      email: user.email,
      satker: user.namaSatker
    };
  });
    
  await setCache(cacheKey, userDtos, 60); // TTL 60 detik
  return userDtos;
}

module.exports = { getAllRoles, getUsersByRole };
