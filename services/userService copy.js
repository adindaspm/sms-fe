const axios = require('axios');
const { apiBaseUrl } = require('../config');
const { delCache } = require('../utils/cache');

exports.getAllUsers = async (token) => {
  const res = await axios.get(`${apiBaseUrl}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

exports.getUserById = async (id, token) => {
  const res = await axios.get(`${apiBaseUrl}/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

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
};

exports.deactivateUser = async (id, token) => {
  await axios.patch(`${apiBaseUrl}/api/users/${id}`, { isActive: false }, { headers: { Authorization: `Bearer ${token}` } });
};

exports.assignUserRole = async (id, roleId, token) => {
  await axios.post(`${apiBaseUrl}/api/users/${id}/roles/${roleId}`, null, { headers: { Authorization: `Bearer ${token}` } });
};

exports.removeUserRole = async (id, roleId, token) => {
  await axios.delete(`${apiBaseUrl}/users/${id}/roles/${roleId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

exports.getRolesByUser = async (id, token) => {
  const res = await axios.get(`${apiBaseUrl}/api/users/${id}/roles`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
