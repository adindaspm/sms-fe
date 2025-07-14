const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');
const { getAllDeputis } = require("../services/deputiService");
const { delCache } = require('../utils/cacheService');

exports.index = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const deputiDtos = await getAllDeputis(token);

    res.render('layout', {
      title: 'Deputi | SMS',
      page: 'pages/manajemenDeputi',
      activePage: 'deputis',
      deputiDtos
    });
  } catch (error) {
    console.error('Error fetching deputis:', error);
    res.status(500).send('Internal Server Error');
  }
}

exports.addForm = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    res.render('layout', {
      title: 'Tambah Deputi | SMS',
      page: 'pages/addDeputi',
      activePage: 'deputis',
      old: null,
      errors: null
    });
  } catch (error) {
    res.redirect(req.get('Referer'));
  }
}

exports.renderAddForm = async (req) => {
  return {
    title: 'Tambah Deputi | SMS',
    page: 'pages/addDeputi',
    activePage: 'deputis'
  }
}

exports.save = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    // Ambil data dari form
    const { name, code } = req.body;

    // Siapkan request body
    const requestBody = {
      name,
      code
    };
    // Kirim ke API
    await axios.post(`${apiBaseUrl}/api/deputis`, requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    delCache(`all_deputis`);

    req.session.successMessage = 'Deputi berhasil ditambahkan.';
    res.redirect('/deputis');
  } catch (error) {
    console.error('Gagal menyimpan deputi:', error.response ? error.response.data : error.message);
    
    req.session.errorMessage = 'Gagal menambahkan deputi.';
    res.redirect('/deputis/add'); // balik ke halaman form
    
    // res.status(500).send('Internal Server Error');
  }
}

// exports.detail = async (req, res) => {
    
// }

// exports.updateForm = async (req, res) => {
    
// }

// exports.update = async (req, res) => {
    
// }