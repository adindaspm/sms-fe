const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');
const { getAllOutputs } = require("../services/outputService");
const { getAllPrograms } = require("../services/programService");
const { delCache } = require('../utils/cacheService');

exports.index = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const outputDtos = await getAllOutputs(token);

    res.render('layout', {
      title: 'Output | SMS',
      page: 'pages/manajemenOutput',
      activePage: 'outputs',
      outputDtos
    });
  } catch (error) {
    console.error('Error fetching outputs:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.renderAddForm = async (req) => {
  const token = req.session.user ? req.session.user.accessToken : null;
  const programDtos = await getAllPrograms(token);

  return {
    title: 'Tambah Output | SMS',
    page: 'pages/addOutput',
    activePage: 'outputs',
    listPrograms: programDtos
  }
}

exports.addForm = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }
    
    const programDtos = await getAllPrograms(token);

    res.render('layout', {
      title: 'Tambah Output | SMS',
      page: 'pages/addOutput',
      activePage: 'outputs',
      listPrograms: programDtos,
      old: null,
      errors: null
    });
  } catch (error) {
    console.error('Error ambil Programs:', error);
    res.redirect(req.get('Referer'));
  }
};

exports.save = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    // Ambil data dari form
    const { name, code, year, program } = req.body;

    // Siapkan request body
    const requestBody = {
      name,
      code,
      year,
      program: JSON.parse(decodeURIComponent(program))
    };
    // Kirim ke API
    await axios.post(`${apiBaseUrl}/api/outputs`, requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    delCache(`all_outputs`);

    req.session.successMessage = 'Output berhasil ditambahkan.';
    res.redirect('/outputs');
  } catch (error) {
    console.error('Gagal menyimpan output:', error.response ? error.response.data : error.message);
    
    req.session.errorMessage = 'Gagal menambahkan output.';
    res.redirect('/outputs/add'); // balik ke halaman form
    
    // res.status(500).send('Internal Server Error');
  }
};