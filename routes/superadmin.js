const express = require('express');
const axios = require('axios');
const router = express.Router();
const { apiBaseUrl } = require('../config');
const { getAllRoles, getUsersByRole } = require('../services/roleService');
const { getAllSatkers, getSatkerById } = require('../services/satkerService');
const { getAllPrograms } = require('../services/programService');
const { getAllProvinces, getSatkersByProvince } = require('../services/provinceService');
const { getAllOutputs } = require('../services/outputService');

// Roles
router.get('/superadmin/roles', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const roleDtos = await getAllRoles(token);

    res.render('layout', {
      title: 'Role | SMS',
      page: 'pages/superadmin/manajemenRole',
      activePage: 'roles',
      roleDtos
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/superadmin/roles/add', (req, res) => {
  res.render('layout', {
    title: 'Role | SMS',
    page: 'pages/superadmin/addRole',
    activePage: 'roles'
  });
});
router.post('/superadmin/roles', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { role } = req.body;

    const requestBody = { name: role }; // di API field-nya "name"

    await axios.post(`${apiBaseUrl}/roles`, requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Berhasil -> simpan pesan sukses
    req.session.successMessage = 'Role berhasil ditambahkan.';
    res.redirect('/superadmin/roles');
  } catch (error) {
    console.error('Gagal menyimpan role:', error.response ? error.response.data : error.message);

    // Gagal -> simpan pesan error
    req.session.errorMessage = 'Gagal menambahkan role.';
    res.redirect('superadmin/roles'); // Balik ke form role
  }
});
router.get('/superadmin/roles/:code/users', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { code } = req.params;

    const userDtos = await getUsersByRole(code, token);
    
    res.render('layout', {
      title: 'Klasifikasi Role Pengguna| SMS',
      page: 'pages/superadmin/usersByRole', 
      activePage: 'roles',
      userDtos
    });
  } catch (error) {
    console.error('Error fetching satkers:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Satkers
router.get('/superadmin/satkers', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const satkerDtos = await getAllSatkers(token);

    res.render('layout', {
      title: 'Satuan Kerja | SMS',
      page: 'pages/superadmin/manajemenSatker',
      activePage: 'satkers',
      satkerDtos
    });
  } catch (error) {
    console.error('Error fetching satkers:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/superadmin/satkers/add', (req, res) => {
  res.render('layout', {
    title: 'Satuan Kerja | SMS',
    page: 'pages/superadmin/addSatker',
    activePage: 'satkers'
  });
});
router.get('/superadmin/satkers/:id/update', async (req, res) => {
  const { id } = req.params;
  const token = req.session.user?.accessToken;

  try {
    const satker = await getSatkerById(id, token);

    res.render('layout', {
      title: 'Update Kegiatan | SMS',
      page: 'pages/superadmin/updateSatker',
      activePage: 'satkers',
      satker
    });
  } catch (error) {
    console.error('Gagal ambil detail satker:', error.message);
    res.send(500).status("Internal Server Error");
  }
});
router.get('/superadmin/satkers/update', async (req, res) => {
  const { id, createdOn,isProvince, name, code, address, number, email } = req.body;
  const token = req.session.user?.accessToken;

  const now = new Date().toISOString();
  
  try {
    const response = await axios.patch(`${apiBaseUrl}/satkers/${id}`, {
      name: name,
      code: code,
      address: address,
      number: number,
      email: email,
      createdOn: createdOn,
      updatedOn: now,
      isProvince: isProvince
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    let satker = response.data; // data kegiatan per ID
    satker = {
      id,
      ...satker
    }

    res.render('layout', {
      title: 'Update Kegiatan | SMS',
      page: 'pages/superadmin/updateSatker',
      activePage: 'satkers',
      satker
    });
  } catch (error) {
    console.error('Gagal ambil detail satker:', error.message);
    res.send(500).status("Internal Server Error");
  }
});

// Provinces
router.get('/superadmin/provinces', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const provinceDtos = await getAllProvinces(token);

    res.render('layout', {
      title: 'Provinsi | SMS',
      page: 'pages/superadmin/manajemenProvinsi',
      activePage: 'provinces',
      provinceDtos
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/superadmin/provinces/:code/satkers', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { code } = req.params;

    const satkerDtos = await getSatkersByProvince(code, token);
    
    res.render('layout', {
      title: 'Satker di Provinsi | SMS',
      page: 'pages/superadmin/satkersByProvince', // ganti kalau mau halaman lain
      activePage: 'provinces',
      satkerDtos
    });
  } catch (error) {
    console.error('Error fetching satkers:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Programs
router.get('/superadmin/programs', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const programDtos = await getAllPrograms(token);

    res.render('layout', {
      title: 'Program | SMS',
      page: 'pages/superadmin/manajemenProgram',
      activePage: 'programs',
      programDtos
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/superadmin/programs/add', (req, res) => {
  res.render('layout', {
    title: 'Program | SMS',
    page: 'pages/superadmin/addProgram',
    activePage: 'programs'
  });
});
router.post('/superadmin/programs', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    // Ambil data dari form
    const { name, code, year } = req.body;

    // Siapkan request body
    const requestBody = {
      name,
      code,
      year
    };

    // Kirim ke API
    await axios.post(`${apiBaseUrl}/programs`, requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Redirect ke halaman daftar program setelah sukses
    req.session.successMessage = 'Program berhasil ditambahkan.';
    res.redirect('/superadmin/programs');
  } catch (error) {
    console.error('Gagal menyimpan program:', error.response ? error.response.data : error.message);
    
    req.session.errorMessage = 'Gagal menambahkan program.';
    res.redirect('superadmin/programs'); // balik ke halaman form
  }
});

// Outputs
router.get('/superadmin/outputs', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const outputDtos = await getAllOutputs(token);

    res.render('layout', {
      title: 'Output | SMS',
      page: 'pages/superadmin/manajemenOutput',
      activePage: 'outputs',
      outputDtos
    });
  } catch (error) {
    console.error('Error fetching outputs:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/superadmin/outputs/add', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }
    
    const programDtos = await getAllPrograms(token);

    res.render('layout', {
      title: 'Tambah Output | SMS',
      page: 'pages/superadmin/addOutput',
      activePage: 'outputs',
      listPrograms: programDtos
    });
  } catch (error) {
    console.error('Error ambil Programs:', error);
    res.redirect(req.get('Referer'));
  }
});
router.post('/superadmin/outputs', async (req, res) => {
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
      program
    };

    // Kirim ke API
    await axios.post(`${apiBaseUrl}/outputs`, requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Redirect ke halaman daftar program setelah sukses
    req.session.successMessage = 'Output berhasil ditambahkan.';
    res.redirect('/superadmin/outputs');
  } catch (error) {
    console.error('Gagal menyimpan output:', error.response ? error.response.data : error.message);
    
    req.session.errorMessage = 'Gagal menambahkan output.';
    res.redirect('supradmin/outputs/add'); // balik ke halaman form
    
    // res.status(500).send('Internal Server Error');
  }
});

module.exports = router;