const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');
const { getProvinceBySatkerId } = require('../services/satkerService');

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

  const satker = await getSatkerByUserId(id, token);
  const province = await getProvinceBySatkerId(satker.id, token);
  let direktorat;
  if (province.code == '00' ){
    direktorat = await getDirektoratByUserId(id, token);
  }
  userDto = {
    id: id,
    name: userDto.name,
    email: userDto.email,
    isActive: userDto.isActive,
    nip: userDto.nip,
    ...userDto,
    satker,
    province,
    direktorat
  };

  await setCache(cacheKey, userDto, 60*60); // TTL 60 detik
  return userDto;
}

async function getUserByEmail(email, token){
  const cacheKey = `userByEmail_${email}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const userResponse = await axios.get(`${apiBaseUrl}/users/search/findByEmail?email=${email}`, {
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

async function getSatkerByUserId(userId, token) {
  try {
    const cacheKey = `satkerByUser_${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const response = await axios.get(`${apiBaseUrl}/users/${userId}/satker`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    // Ambil field name dan code saja dari responsenya
    const { name, code, address, number, email, _links } = response.data;

    const href = _links?.self?.href || '';
    const matches = href.match(/\/satkers\/(\d+)/);
    const id = matches ? parseInt(matches[1]) : null;

    const province = await getProvinceBySatkerId(id, token);

    const satker = { id, name, address, number, email, code, province };

    await setCache(cacheKey, satker, 60*60);
    return satker;
  } catch (err) {
    console.error(`Gagal ambil satker untuk pengguna ${userId}:`, err.message);
    return null; // supaya tidak crash kalau gagal
  }
}

async function getDirektoratByUserId(userId, token) {
  try {
    const cacheKey = `direktoratByUser_${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;
    
    const response = await axios.get(`${apiBaseUrl}/users/${userId}/direktorat`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    // Ambil field name dan code saja dari responsenya
    const { code, name, _links } = response.data;

    const href = _links?.self?.href || '';
    const matches = href.match(/\/direktorats\/(\d+)/);
    const id = matches ? parseInt(matches[1]) : null;

    const direktorat = { id, code, name };

    await setCache(cacheKey, direktorat, 60*60);
    return direktorat;
  } catch (err) {
    console.error(`Gagal ambil direktorat untuk pengguna ${userId}:`, err.message);
    return null; // supaya tidak crash kalau gagal
  }
}

module.exports = { getAllUsers, getRolesByUser, getUserById, getUserByEmail };
