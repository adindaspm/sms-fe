const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');
const { getAllPrograms } = require("../services/programService");
const { delCache } = require('../utils/cacheService');
const { getOutputsByProgramId } = require('../services/outputService');

exports.index = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const programDtos = await getAllPrograms(token);

    res.render('layout', {
      title: 'Program | SMS',
      page: 'pages/manajemenProgram',
      activePage: 'programs',
      programDtos
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.renderAddForm = async (req) => {
  return {
    title: 'Program | SMS',
    page: 'pages/addProgram',
    activePage: 'programs'
  }
}

exports.addForm = async (req, res) => {
  try {
    res.render('layout', {
    title: 'Program | SMS',
    page: 'pages/addProgram',
    activePage: 'programs',
    old: null,
    errors: null
  });
  } catch (error) {
    console.error(error);
    req.session.errorMassage = 'Gagal menampilkan form! Coba lagi nanti.';
    res.render(req.get('Referer'));
  }
};

exports.save = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { name, code, year } = req.body;

    const requestBody = {
      name,
      code,
      year
    };

    await axios.post(`${apiBaseUrl}/programs`, requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    delCache(`all_programs`);

    req.session.successMessage = 'Program berhasil ditambahkan.';
    res.redirect('/programs');
  } catch (error) {
    console.error('Gagal menyimpan program:', error.response ? error.response.data : error.message);
    
    req.session.errorMessage = 'Gagal menambahkan program.';
    res.redirect('programs'); // balik ke halaman form
  }
};

exports.outputsByProgram = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const programId = req.params.id;

    const outputs = await getOutputsByProgramId(programId, token);
    res.json(outputs);
  } catch (err) {
    console.error('Gagal ambil output:', err.message);
    res.status(500).json({ message: 'Gagal ambil output' });
  }
}