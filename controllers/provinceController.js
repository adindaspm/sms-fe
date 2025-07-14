const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');
const { getSatkersByProvince, getAllProvinces } = require("../services/provinceService");
const { delCache } = require('../utils/cacheService');

exports.index = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const provinceDtos = await getAllProvinces(token);

    res.render('layout', {
      title: 'Provinsi | SMS',
      page: 'pages/manajemenProvinsi',
      activePage: 'provinces',
      provinceDtos
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).send('Internal Server Error');
  }
};

// exports.addForm = async (req, res) => {
  
// };

// exports.save = async (req, res) => {
  
// };

exports.satkersByProvince = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { code } = req.params;

    const satkerDtos = await getSatkersByProvince(code, token);
    
    res.render('layout', {
      title: 'Satker di Provinsi | SMS',
      page: 'pages/satkersByProvince', // ganti kalau mau halaman lain
      activePage: 'provinces',
      satkerDtos
    });
  } catch (error) {
    console.error('Error fetching satkers:', error);
    res.status(500).send('Internal Server Error');
  }
};