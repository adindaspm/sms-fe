const axios = require('axios');

async function loginAndSave(email, password) {
  const response = await axios.post('http://localhost/login', {
    email,
    password
  });
  return response.data;
}

module.exports = { loginAndSave };
