const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');
const { getAllDeputis } = require("../services/deputiService");
const { getAllDirektorats } = require("../services/direktoratService");
const { delCache } = require('../utils/cacheService');

exports.index = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const direktoratDtos = await getAllDirektorats(token);

    res.render('layout', {
      title: 'Direktorat | SMS',
      page: 'pages/manajemenDirektorat',
      activePage: 'direktorats',
      direktoratDtos
    });
  } catch (error) {
    console.error('Error fetching direktorats:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.addForm = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }
    
    const deputiDtos = await getAllDeputis(token);

    res.render('layout', {
      title: 'Tambah Direktorat | SMS',
      page: 'pages/addDirektorat',
      activePage: 'direktorats',
      listDeputis: deputiDtos,
      old: null,
      errors: null
    });
  } catch (error) {
    console.error('Error ambil Deputis:', error);
    res.redirect(req.get('Referer'));
  }
};

exports.renderAddForm = async (req) => {
  const token = req.session.user ? req.session.user.accessToken : null;
  const deputiDtos = await getAllDeputis(token);

  return {
    title: 'Tambah Direktorat | SMS',
    page: 'pages/addDirektorat',
    activePage: 'direktorats',
    listDeputis: deputiDtos
  }
};

exports.save = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    // Ambil data dari form
    const { name, code, deputi } = req.body;

    const parsedDeputi = JSON.parse(decodeURIComponent(deputi)); // <- parse kembali ke object

    // Siapkan request body
    const requestBody = {
      name,
      code,
      deputi: parsedDeputi
    };
    // Kirim ke API
    await axios.post(`${apiBaseUrl}/api/direktorats`, requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    delCache(`all_direktorats`);

    req.session.successMessage = 'Direktorat berhasil ditambahkan.';
    res.redirect('direktorats');
  } catch (error) {
    console.error('Gagal menyimpan direktorat:', error.response ? error.response.data : error.message);
    
    req.session.errorMessage = 'Gagal menambahkan direktorat.';
    res.redirect('/add'); // balik ke halaman form
  }
};