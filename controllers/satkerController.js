const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');
const { getAllProvinces } = require("../services/provinceService");
const { getSatkerById, getAllSatkers } = require("../services/satkerService");
const { delCache } = require('../utils/cacheService');

exports.index = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const satkerDtos = await getAllSatkers(token);

    res.render('layout', {
      title: 'Satuan Kerja | SMS',
      page: 'pages/manajemenSatker',
      activePage: 'satkers',
      satkerDtos
    });
  } catch (error) {
    console.error('Error fetching satkers:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.renderAddForm = async (req) => {
  const token = req.session.user?.accessToken;
  const provinceDtos = await getAllProvinces(token);

  return {
    title: 'Satuan Kerja | SMS',
    page: 'pages/addSatker',
    activePage: 'satkers',
    provinceDtos
  }
}

exports.addForm = async (req, res) => {
  try{
    const token = req.session.user?.accessToken;
    const provinceDtos = await getAllProvinces(token);
    res.render('layout', {
      title: 'Satuan Kerja | SMS',
      page: 'pages/addSatker',
      activePage: 'satkers',
      provinceDtos,
      errors: null,
      old: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.save = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    if (!token) return res.redirect('/login');

    const { name, code, address, number, email, province } = req.body;

    const isProvince = code.slice(-2) === '00';

    const payload = {
      name,
      code,
      address: address || '',
      number: number || '',
      email,
      province: province.id,
      isProvince
    };

    await axios.post(`${apiBaseUrl}/api/satkers`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    delCache('all_satkers');

    req.session.successMessage = 'Satuan Kerja berhasil ditambahkan.';
    res.redirect('/satkers');
  } catch (error) {
    console.error('Gagal menyimpan satker:', error?.response?.data || error.message);
    req.session.errorMessage = 'Gagal menambahkan satuan kerja.';
    res.redirect(req.get('Referer'));
  }
};

exports.renderUpdateForm = async (req) => {
  const { id } = req.params;
  const token = req.session.user?.accessToken;

  const satker = await getSatkerById(id, token);
  const provinceDtos = await getAllProvinces(token);

  return {
    title: 'Update Kegiatan | SMS',
    page: 'pages/updateSatker',
    activePage: 'satkers',
    satker,
    provinceDtos
  }
}
exports.updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.session.user?.accessToken;

    const satker = await getSatkerById(id, token);
    const provinceDtos = await getAllProvinces(token);
    res.render('layout', {
      title: 'Update Kegiatan | SMS',
      page: 'pages/updateSatker',
      activePage: 'satkers',
      satker,
      provinceDtos,
      errors: null,
      old: null
    });
  } catch (error) {
    console.error('Gagal ambil detail satker:', error.message);
    res.send(500).status("Internal Server Error");
  }
};

exports.update = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    if (!token) return res.redirect('/login');

    const { id } = req.params;
    const { name, code, address, number, email, province } = req.body;

    const isProvince = code.slice(-2) === '00';
    const provinceCode = code.substring(0, 2);
    
    const payload = {
      name,
      code,
      address: address || '',
      number: number || '',
      email,
      province: province.id,
      isProvince
    };

    await axios.patch(`${apiBaseUrl}/api/satkers/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await delCache('all_satkers');
    await delCache(`satker_${id}`);

    req.session.successMessage = 'Satuan Kerja berhasil diperbarui.';
    res.redirect('/satkers');
  } catch (error) {
    console.error('Gagal memperbarui satker:', error?.response?.data || error.message);
    req.session.errorMessage = 'Gagal memperbarui satuan kerja.';
    res.redirect(req.get('Referer'));
  }
};