const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');

async function getAllUsers(token) {
  const cacheKey = 'all_users';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/users`, {
    params: { size: 10000 },
    headers: { Authorization: `Bearer ${token}` }
  });

  const userDtos = (response.data._embedded.users || []).map(user => {
    const idMatch = user._links?.self?.href?.match(/\/(\d+)/);
    return {
      id: idMatch?.[1] || null,
      ...user
    };
  });

  await setCache(cacheKey, userDtos, 60); // TTL 60 detik
  return userDtos;
}

async function getUserById(id, token){
  const cacheKey = `user_${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const userResponse = await axios.get(`${apiBaseUrl}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let userDto = userResponse.data;

  userDto = {
    id: id,
    ...userDto
  };
  
  await setCache(cacheKey, userDto, 60); // TTL 60 detik
  return userDto;
}

async function getUserByEmail(email, token){
  const cacheKey = `userByEmail_${email}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const userResponse = await axios.get(`http://localhost/users/search/findByEmail?email=${email}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
  let userDto = userResponse.data; // Response yang isinya name, email, dst.
  
  const href = userDto._links?.self?.href || userDto._links?.additionalProp1?.href;
  if (href) {
    const idMatch = href.match(/\/users\/(\d+)/); // ambil angka setelah /users/
    if (idMatch) {
      userDto.id = idMatch[1];
    }
  }
  
  await setCache(cacheKey, userDto, 60); // TTL 60 detik
  return userDto;
}

async function getRolesByUser(id, token){
  const cacheKey = `rolesByUser_${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const userRolesResponse = await axios.get(`${apiBaseUrl}/users/${id}/roles`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let userRoleDtos = userRolesResponse.data._embedded.roles || [];

  userRoleDtos = userRoleDtos.map(role => {
    const href = role._links?.self?.href || '';
    const idMatch = href.match(/\/roles\/(\d+)/);
    const id = idMatch ? idMatch[1] : null;

    return {
      id,
      code: role.code,
      name: role.name
    };
  });
  
  await setCache(cacheKey, userRoleDtos, 60); // TTL 60 detik
  return userRoleDtos;
}

module.exports = { getAllUsers, getRolesByUser, getUserById, getUserByEmail };
