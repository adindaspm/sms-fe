const axios = require('axios');
const { getCache, setCache, delCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');
const { getProvinceBySatkerId } = require('../services/satkerService');

/**
 * Helper: Extract ID from HATEOAS URL.
 */
const extractIdFromHref = (href, prefix) => {
  const regex = new RegExp(`/${prefix}/(\\d+)`);
  const match = href?.match(regex);
  return match ? match[1] : null;
};

/**
 * Ambil semua user dengan cache.
 */
exports.getAllUsers = async (token) => {
  const cacheKey = 'all_users';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/api/users`, {
    params: { size: 10000 },
    headers: { Authorization: `Bearer ${token}` }
  });

  const userDtos = (response.data || []);

  await setCache(cacheKey, userDtos, 60);
  return userDtos;
};

/**
 * Ambil user berdasarkan ID, beserta satker, provinsi, dan direktorat (jika satker pusat).
 */
exports.getUserById = async (id, token) => {
  const cacheKey = `user_${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const userResponse = await axios.get(`${apiBaseUrl}/api/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const user = userResponse.data;

  const satker = await getSatkerByUserId(id, token);
  const province = satker ? await getProvinceBySatkerId(satker.id, token) : null;

  let direktorat = null;
  let deputi = null;

  if (province?.code === '00') {
    direktorat = await getDirektoratByUserId(id, token);
    deputi = await getDeputiByUserId(id,token);
  }

  const userDto = {
    id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    nip: user.nip,
    ...user,
    satker,
    province,
    direktorat,
    deputi
  };

  await setCache(cacheKey, userDto, 3600);
  return userDto;
};

/**
 * Ambil user berdasarkan email.
 */
exports.getUserByEmail = async (email, token) => {
  const cacheKey = `userByEmail_${email}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/users/search/findByEmail?email=${email}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const userDto = response.data;
  const href = userDto._links?.self?.href || userDto._links?.additionalProp1?.href;
  userDto.id = extractIdFromHref(href, 'users');

  await setCache(cacheKey, userDto, 60);
  return userDto;
};

/**
 * Ambil daftar role untuk user.
 */
exports.getRolesByUser = async (userId, token) => {
  const cacheKey = `rolesByUser_${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${apiBaseUrl}/users/${userId}/roles`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const roles = (response.data._embedded?.roles || []).map(role => ({
    id: extractIdFromHref(role._links?.self?.href, 'roles'),
    code: role.code,
    name: role.name
  }));

  await setCache(cacheKey, roles, 60);
  return roles;
};

/**
 * Ambil satker user.
 */
const getSatkerByUserId = async (userId, token) => {
  const cacheKey = `satkerByUser_${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${apiBaseUrl}/users/${userId}/satker`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    const { name, code, address, number, email, _links } = response.data;
    const id = extractIdFromHref(_links?.self?.href, 'satkers');
    const province = await getProvinceBySatkerId(id, token);

    const satker = { id, name, address, number, email, code, province };

    await setCache(cacheKey, satker, 3600);
    return satker;
  } catch (err) {
    console.error(`Gagal ambil satker untuk user ${userId}:`, err.message);
    return null;
  }
};
exports.getSatkerByUserId = getSatkerByUserId;

/**
 * Ambil direktorat user jika satkernya pusat.
 */
const getDirektoratByUserId = async (userId, token) => {
  const cacheKey = `direktoratByUser_${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${apiBaseUrl}/api/users/${userId}/direktorat`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    const data = response.data;
    const direktorat = {
      id: data.id,
      code: data.code,
      name: data.name,
      deputi: data.deputi
        ? {
            id: data.deputi.id,
            code: data.deputi.code,
            name: data.deputi.name
          }
        : null
    };

    await setCache(cacheKey, direktorat, 3600);
    return direktorat;
  } catch (err) {
    console.error(`Gagal ambil direktorat untuk user ${userId}:`, err.message);
    return null;
  }
};
exports.getDirektoratByUserId = getDirektoratByUserId;

const getDeputiByUserId = async (userId, token) => {
  const cacheKey = `deputiByUser_${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${apiBaseUrl}/api/users/${userId}/deputi`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    const data = response.data;
    const deputi = {
      id: data.id,
      code: data.code,
      name: data.name
    };

    await setCache(cacheKey, deputi, 3600);
    return deputi;
  } catch (err) {
    console.error(`Gagal ambil deputi untuk user ${userId}:`, err.message);
    return null;
  }
};
exports.getDeputiByUserId = getDeputiByUserId;

exports.saveUser = async (payload, token) => {
  await axios.post(`${apiBaseUrl}/api/users`, payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
};

exports.updateUser = async (id, payload, token) => {
  await axios.patch(`${apiBaseUrl}/api/users/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
};

exports.activateUser = async (id, token) => {
  await axios.patch(`${apiBaseUrl}/api/users/${id}`, { isActive: true }, { headers: { Authorization: `Bearer ${token}` } });
  await delCache('all_users');
  await delCache(`user_${id}`);
};

exports.deactivateUser = async (id, token) => {
  await axios.patch(`${apiBaseUrl}/api/users/${id}`, { isActive: false }, { headers: { Authorization: `Bearer ${token}` } });
  await delCache('all_users');
  await delCache(`user_${id}`);
};

exports.assignUserRole = async (id, roleId, token) => {
  await axios.post(`${apiBaseUrl}/api/users/${id}/roles/${roleId}`, null, { headers: { Authorization: `Bearer ${token}` } });
};

exports.removeUserRole = async (id, roleId, token) => {
  await axios.delete(`${apiBaseUrl}/users/${id}/roles/${roleId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
