const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { apiBaseUrl } = require('../config');
const { getAllUsers, getUserById, getRolesByUser } = require('../services/userService');
const { getAllSatkers } = require('../services/satkerService');
const { getAllRoles } = require('../services/roleService');

router.get('/admin/users', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const userDtos = await getAllUsers(token);

    res.render('layout', {
      title: 'Pengguna | SMS',
      page: 'pages/admin/manajemenPengguna',
      activePage: 'users',
      userDtos
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
    
    req.session.errorMessage = 'Gagal mengambil data pengguna.';
    res.redirect('/');
  }
});
router.get('/admin/users/add', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }
    
    const satkerDtos = await getAllSatkers(token);
    
    res.render('layout', {
      title: 'Tambah Pengguna | SMS',
      page: 'pages/admin/addPengguna',
      activePage: 'users',
      listSatkers: satkerDtos
    });
  } catch (error) {
    console.error('Error ambil Satkers:', error);
    res.redirect(req.get('Referer'));
  }
});
router.post('/admin/users/save', [
  body('first_name').notEmpty().withMessage('Nama depan wajib diisi'),
  body('last_name').notEmpty().withMessage('Nama belakang wajib diisi'),
  body('nip').isNumeric().withMessage('NIP harus berupa angka'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('satker').notEmpty().withMessage('Satuan Kerja wajib dipilih'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('admin/users/form', {
        errors: errors.array(),
        old: req.body,
      });
    }

    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { first_name, last_name, nip, email, satker } = req.body;
    const parsedSatker = JSON.parse(decodeURIComponent(satker)); // <- parse kembali ke object

    // Gabung nama depan + nama belakang jadi fullName
    // const fullName = `${first_name} ${last_name}`;
    const payload = {
      firstName: first_name,
      lastName: last_name,
      nip: nip,
      email: email,
      password: nip, // Default password = NIP
      satker: parsedSatker
    };
    
    await axios.post(`${apiBaseUrl}/api/users`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    req.session.successMessage = 'Pengguna berhasil ditambahkan.';
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error simpan pengguna:', error?.response?.data || error.message);
    
    // res.status(500).send('Internal Server Error');
    req.session.errorMessage = 'Gagal menambahkan pengguna.';
    res.redirect('/admin/users/add');
  }
});
router.get('/admin/users/detail/:id', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const userId = req.params.id;

    const userData = await getUserById(userId, token);
    let userRoles = await getRolesByUser(userId, token);

    // Map roles
    userRoles = userRoles.map(role => {
      return {
        name: role.name.replace('ROLE_', '') // Hilangin prefix ROLE_
      };
    });

    // Buat DTO untuk dikirim ke view
    const userDto = {
      id: userId,
      name: userData.name,
      email: userData.email,
      satker: userData.namaSatker,
      roles: userRoles
    };

    res.render('layout', {
      title: 'Detail Pengguna | SMS',
      page: 'pages/admin/detailPengguna',
      activePage: 'users',
      user: userDto
    });

  } catch (error) {
    console.error('Error mengambil detail user:', error.response ? error.response.data : error.message);
    req.session.errorMessage = 'Gagal mengambil data user.';
    res.redirect('/admin/users'); // Balik ke halaman list user kalau gagal
  }
});
router.get('/admin/users/:id/roles', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const userId = req.params.id;
    const userDto = await getUserById(userId, token);
    const roleDtos = await getAllRoles(token);
    const userRoleDtos = await getRolesByUser(userId, token);

    res.render('layout', {
      title: 'Kelola Peran Pengguna | SMS',
      page: 'pages/admin/kelolaPeran',
      activePage: 'users',
      userDto,
      roleDtos,
      userRoleDtos
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.post('/admin/users/:id/roles/assign', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const userId = req.params.id;
    const { roleId } = req.body;

    await axios.post(`${apiBaseUrl}/api/users/${userId}/roles/${roleId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }
    );

    req.session.successMessage = 'Berhasil menambah role pengguna.';
    res.redirect(`/admin/users/${userId}/roles`);
  } catch (error) {
    console.error('Error assigning role:', error);
    // res.status(500).send('Internal Server Error');
    req.session.errorMessage = 'Gagal menambahkan role pengguna.';
    res.redirect(`/admin/users/${userId}/roles`);
  }
});
router.post('/admin/users/:id/roles/remove', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const userId = req.params.id;
    const { roleId } = req.body;

    await axios.delete(`${apiBaseUrl}/users/${userId}/roles/${roleId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    req.session.successMessage = 'Berhasil menghapus role pengguna.';
    res.redirect(`/admin/users/${userId}/roles`);
  } catch (error) {
    console.error('Error removing role:', error);
    // res.status(500).send('Internal Server Error');
    req.session.errorMessage = 'Gagal menghapus role pengguna.';
    res.redirect(`/admin/users/${userId}/roles`);
  }
});

module.exports = router;