const axios = require('axios');
const { apiBaseUrl } = require('../config');

async function loginAndSave(email, password) {
  console.log(`${apiBaseUrl}/login`)
  const response = await axios.post(`${apiBaseUrl}/login`, {
    email,
    password
  });
  return response.data;
}

module.exports = { loginAndSave };
