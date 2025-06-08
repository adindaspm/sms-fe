const express = require('express');
const axios = require('axios');
const router = express.Router();
const { apiBaseUrl } = require('../config');

// Users
router.get('/admin/users', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const response = await axios.get(`${apiBaseUrl}/users`, {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let userDtos = response.data._embedded.users || [];

    userDtos = userDtos.map(user => {
      const href = user._links?.self?.href || '';
      const idMatch = href.match(/\/users\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        email: user.email,
        name: user.name,
        roleName: user.roleName
      };
    });

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
    
    const response = await axios.get(`${apiBaseUrl}/satkers`, {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    let listSatkers = response.data._embedded.satkers || [];

    listSatkers = listSatkers.map(satker => {
      const href = satker._links?.self?.href || '';
      const idMatch = href.match(/\/satkers\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        ...satker
      };
    });
    
    res.render('layout', {
      title: 'Tambah Pengguna | SMS',
      page: 'pages/admin/addPengguna',
      activePage: 'users',
      listSatkers: listSatkers
    });
  } catch (error) {
    console.error('Error ambil Satkers:', error);
    res.redirect(req.get('Referer'));
  }
});
router.post('/admin/users/save', async (req, res) => {
  try {
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

    // Panggil API /users/{id}
    const response = await axios.get(`${apiBaseUrl}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const userData = response.data;

    // Ambil roles user
    const rolesResponse = await axios.get(`${apiBaseUrl}/users/${userId}/roles`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    let userRoles = rolesResponse.data._embedded?.roles || [];

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

    // Ambil data user
    const userResponse = await axios.get(`${apiBaseUrl}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let userDto = userResponse.data;

    userDto = {
      id: userId,
      ...userDto
    };

    // Ambil semua roles
    const allRolesResponse = await axios.get(`${apiBaseUrl}/roles`, {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { Authorization: `Bearer ${token}` }
    });
    let roleDtos = allRolesResponse.data._embedded.roles || [];

    roleDtos = roleDtos.map(role => {
      const href = role._links?.self?.href || '';
      const idMatch = href.match(/\/roles\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        code: role.code,
        name: role.name
      };
    });

    // Ambil roles milik user ini
    const userRolesResponse = await axios.get(`${apiBaseUrl}/users/${userId}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let userRoleDtos = userRolesResponse.data._embedded.roles || [];

    userRoleDtos = userRoleDtos.map(role => {
      const href = role._links?.self?.href || '';
      const idMatch = href.match(/\/roles\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        code: role.code,
        name: role.name
      };
    });

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