const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');
const { getUsersByRole, getAllRoles } = require("../services/roleService");
const { delCache } = require('../utils/cacheService');

exports.index = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const roleDtos = await getAllRoles(token);

    res.render('layout', {
      title: 'Role | SMS',
      page: 'pages/manajemenRole',
      activePage: 'roles',
      roleDtos
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.renderAddForm = async (req) => {
  return {
    title: 'Role | SMS',
    page: 'pages/addRole',
    activePage: 'roles'
  }
};

exports.addForm = async (req, res) => {
  try {
    res.render('layout', {
        title: 'Role | SMS',
        page: 'pages/addRole',
        activePage: 'roles',
        old: null,
        errors: null
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = 'Gagal menampilkan halaman';
    res.render(req.get('Referer'));
  }
};

exports.save = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { name } = req.body;

    const requestBody = { name: name };

    await axios.post(`${apiBaseUrl}/roles`, requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    delCache(`all_roles`);

    req.session.successMessage = 'Role berhasil ditambahkan.';
    res.redirect('/roles');
  } catch (error) {
    console.error('Gagal menyimpan role:', error.response ? error.response.data : error.message);

    // Gagal -> simpan pesan error
    req.session.errorMessage = 'Gagal menambahkan role.';
    res.redirect('roles'); // Balik ke form role
  }
};

exports.usersByRole = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { code } = req.params;

    const userDtos = await getUsersByRole(code, token);
    
    res.render('layout', {
      title: 'Klasifikasi Role Pengguna| SMS',
      page: 'pages/usersByRole', 
      activePage: 'roles',
      userDtos
    });
  } catch (error) {
    console.error('Error fetching satkers:', error);
    req.session.errorMessage = 'Gagal menampilkan form!';
    res.render(req.get('Referer'));
  }
};