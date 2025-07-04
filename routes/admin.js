const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { apiBaseUrl } = require('../config');
const { getAllUsers, getUserById, getRolesByUser } = require('../services/userService');
const { getAllSatkers } = require('../services/satkerService');
const { getAllRoles } = require('../services/roleService');
const { validateUser } = require('../validators/userValidator');
const handleValidation = require('../middleware/handleValidation');
const { delCache } = require('../utils/cacheService');
const { getAllProvinces } = require('../services/provinceService');
const { getAllDeputis } = require('../services/deputiService');
const { getAllDirektorats } = require('../services/direktoratService');


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
    res.redirect(req.get('Referer'));
  }
});
router.get('/admin/users/add', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }
    
    const provinceDtos = await getAllProvinces(token);
    const satkerDtos = await getAllSatkers(token);
    const deputiDtos = await getAllDeputis(token);
    const direktoratDtos = await getAllDirektorats(token);
    
    res.render('layout', {
      title: 'Tambah Pengguna | SMS',
      page: 'pages/admin/addPengguna',
      activePage: 'users',
      listProvinces: provinceDtos,
      listSatkers: satkerDtos,
      listDeputis: deputiDtos,
      listDirektorats: direktoratDtos,
      old: null,
      errors: null
    });
  } catch (error) {
    console.error('Error ambil Satkers:', error);
    res.redirect(req.get('Referer'));
  }
});
router.post('/admin/users/save', validateUser, handleValidation('layout', async (req) => {
    const token = req.session.user ? req.session.user.accessToken : null;
    const listSatkers = await getAllSatkers(token);
    const listProvinces = await getAllProvinces(token);
    const listDeputis = await getAllDeputis(token);
    const listDirektorats = await getAllDirektorats(token);
    return{
      title: 'Tambah Pengguna | SMS',
      page: 'pages/admin/addPengguna',
      activePage: 'users',
      listSatkers,
      listProvinces,
      listDeputis,
      listDirektorats
    };
  }),
  async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { first_name, last_name, nip, email, satker, direktorat } = req.body;
    const parsedSatker = JSON.parse(decodeURIComponent(satker)); // <- parse kembali ke object
    const parsedDirektorat = JSON.parse(decodeURIComponent(direktorat)); // <- parse kembali ke object

    const isActive = true;
    // Gabung nama depan + nama belakang jadi fullName
    // const fullName = `${first_name} ${last_name}`;
    const payload = {
      firstName: first_name,
      lastName: last_name,
      nip: nip,
      email: email,
      password: nip, // Default password = NIP
      satker: parsedSatker,
      direktorat: parsedDirektorat,
      isActive
    };
    
    await axios.post(`${apiBaseUrl}/api/users`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    await delCache('all_users');

    req.session.successMessage = 'Pengguna berhasil ditambahkan.';
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error simpan pengguna:', error?.response?.data || error.message);
    
    // res.status(500).send('Internal Server Error');
    req.session.errorMessage = 'Gagal menambahkan pengguna.';
    res.redirect(req.get('Referer'));
  }
});
router.post('/admin/users/:id/activate', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { id } = req.params;
    
    const payload = {
      isActive: true
    };
    
    await axios.patch(`${apiBaseUrl}/api/users/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await delCache(`user_${id}`);
    await delCache(`all_users`);

    req.session.successMessage = 'Pengguna berhasil diaktifkan.';
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error mengaktifkan pengguna:', error?.response?.data || error.message);
    
    // res.status(500).send('Internal Server Error');
    req.session.errorMessage = 'Gagal mengaktifkan pengguna.';
    res.redirect('/admin/users');
  }
});
router.post('/admin/users/:id/deactivate', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { id } = req.params;
    
    const payload = {
      isActive: false
    };
    
    await axios.patch(`${apiBaseUrl}/api/users/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await delCache(`user_${id}`);
    await delCache(`all_users`);

    req.session.successMessage = 'Pengguna berhasil dinonaktifkan.';
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error menonaktifkan pengguna:', error?.response?.data || error.message);
    
    // res.status(500).send('Internal Server Error');
    req.session.errorMessage = 'Gagal menonaktifkan pengguna.';
    res.redirect('/admin/users');
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
      ...userData,
      roles: userRoles
    };

    res.json(userDto);
  } catch (error) {
    console.error('Error mengambil detail user:', error.response ? error.response.data : error.message);
    req.session.errorMessage = 'Gagal mengambil data user.';
    // res.redirect('/admin/users'); // Balik ke halaman list user kalau gagal
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

    await delCache(`rolesByUser_${userId}`);

    req.session.successMessage = 'Berhasil menambah role pengguna.';
    res.redirect(`/admin/users/${userId}/roles`);
  } catch (error) {
    console.error('Error assigning role:', error);
    // res.status(500).send('Internal Server Error');
    req.session.errorMessage = 'Gagal menambahkan role pengguna.';
    res.redirect(req.get('Referer'));
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
    
    await delCache(`rolesByUser_${userId}`);
    
    req.session.successMessage = 'Berhasil menghapus role pengguna.';
    res.redirect(`/admin/users/${userId}/roles`);
  } catch (error) {
    console.error('Error removing role:', error);
    // res.status(500).send('Internal Server Error');
    req.session.errorMessage = 'Gagal menghapus role pengguna.';
    res.redirect(`/admin/users/${userId}/roles`);
  }
});
router.get('/admin/users/:id/update', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }
    const { id } = req.params;
    
    const provinceDtos = await getAllProvinces(token);
    const satkerDtos = await getAllSatkers(token);
    const deputiDtos = await getAllDeputis(token);
    const direktoratDtos = await getAllDirektorats(token);
    
    const user = await getUserById(id, token);

    res.render('layout', {
      title: 'Perbarui Data Pengguna | SMS',
      page: 'pages/admin/updatePengguna',
      activePage: 'users',
      listProvinces: provinceDtos,
      listSatkers: satkerDtos,
      listDeputis: deputiDtos,
      listDirektorats: direktoratDtos,
      user,
      old: null,
      errors: null
    });
  } catch (error) {
    console.error('Error ambil Satkers:', error);
    res.redirect(req.get('Referer'));
  }
});
router.post('/admin/users/:id/update', validateUser, handleValidation('layout', async (req) => {
    const token = req.session.user ? req.session.user.accessToken : null;
    const { id } = req.params;
    const user = await getUserById(id, token);
    const listSatkers = await getAllSatkers(token);
    const listProvinces = await getAllProvinces(token);
    const listDeputis = await getAllDeputis(token);
    const listDirektorats = await getAllDirektorats(token);
    return{
      title: 'Perbarui Data Pengguna | SMS',
      page: 'pages/admin/updatePengguna',
      activePage: 'users',
      listSatkers,
      listProvinces,
      listDeputis,
      listDirektorats,
      user
    };
  }),
  async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { id } = req.params;
    const { name, nip, email, satker } = req.body;
    const parsedSatker = JSON.parse(decodeURIComponent(satker)); // <- parse kembali ke object

    const payload = {
      name,
      nip: nip,
      email: email,
      satker: parsedSatker
    };
    
    await axios.patch(`${apiBaseUrl}/api/users/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    await delCache('all_users');
    await delCache(`user_${id}`);

    req.session.successMessage = 'Pengguna berhasil diperbarui.';
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error memperbarui data pengguna:', error?.response?.data || error.message);
    
    // res.status(500).send('Internal Server Error');
    req.session.errorMessage = 'Gagal memperbarui data pengguna.';
    res.redirect(req.get('Referer'));
  }
});

module.exports = router;