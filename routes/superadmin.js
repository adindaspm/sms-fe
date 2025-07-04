const express = require('express');
const axios = require('axios');
const router = express.Router();
const { apiBaseUrl } = require('../config');
const { getAllRoles, getUsersByRole } = require('../services/roleService');
const { getAllSatkers, getSatkerById } = require('../services/satkerService');
const { getAllPrograms } = require('../services/programService');
const { getAllProvinces, getSatkersByProvince } = require('../services/provinceService');
const { getAllOutputs } = require('../services/outputService');
const { getAllDeputis } = require('../services/deputiService');
const { getAllDirektorats } = require('../services/direktoratService');
const { validateRole } = require('../validators/roleValidator');
const { validateProgram } = require('../validators/programValidator');
const { validateOutput } = require('../validators/outputValidator');
const { validateSatker } = require('../validators/satkerValidator');
const { validateDeputi } = require('../validators/deputiValidator');
const { validateDirektorat } = require('../validators/direktoratValidator');
const handleValidation = require('../middleware/handleValidation');
const { delCache } = require('../utils/cacheService');

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
    activePage: 'roles',
    old: null,
    errors: null
  });
});
router.post('/superadmin/roles', validateRole, handleValidation('layout', async (req) => ({
    title: 'Role | SMS',
    page: 'pages/superadmin/addRole',
    activePage: 'roles'
})), 
  async (req, res) => {
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
router.get('/superadmin/satkers/add', async (req, res) => {
  try{
    const token = req.session.user?.accessToken;
    const provinceDtos = await getAllProvinces(token);
    res.render('layout', {
      title: 'Satuan Kerja | SMS',
      page: 'pages/superadmin/addSatker',
      activePage: 'satkers',
      provinceDtos,
      errors: null,
      old: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.post('/superadmin/satkers', validateSatker, handleValidation('layout', async (req) => {
    const token = req.session.user?.accessToken;
    const provinceDtos = await getAllProvinces(token);
    return{
      title: 'Satuan Kerja | SMS',
      page: 'pages/superadmin/addSatker',
      activePage: 'satkers',
      provinceDtos
    }
  }),
  async (req, res) => {
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
    res.redirect('/superadmin/satkers');
  } catch (error) {
    console.error('Gagal menyimpan satker:', error?.response?.data || error.message);
    req.session.errorMessage = 'Gagal menambahkan satuan kerja.';
    res.redirect(req.get('Referer'));
  }
});
router.get('/superadmin/satkers/:id/update', async (req, res) => {
  const { id } = req.params;
  const token = req.session.user?.accessToken;

  try {
    const satker = await getSatkerById(id, token);
    const provinceDtos = await getAllProvinces(token);
    res.render('layout', {
      title: 'Update Kegiatan | SMS',
      page: 'pages/superadmin/updateSatker',
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
});
router.post('/superadmin/satkers/:id/update', validateSatker, handleValidation('layout', async (req) => {
    const token = req.session.user?.accessToken;
    const provinceDtos = await getAllProvinces(token);
    const { id } = req.params;
    const satker = await getSatkerById(id,token);
    return{
      title: 'Update Kegiatan | SMS',
      page: 'pages/superadmin/updateSatker',
      activePage: 'satkers',
      satker,
      provinceDtos
    }
  }),
  async (req, res) => {
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

    delCache('all_satkers');
    delCache(`satker_${id}`);

    req.session.successMessage = 'Satuan Kerja berhasil diperbarui.';
    res.redirect('/superadmin/satkers');
  } catch (error) {
    console.error('Gagal memperbarui satker:', error?.response?.data || error.message);
    req.session.errorMessage = 'Gagal memperbarui satuan kerja.';
    res.redirect(req.get('Referer'));
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
    activePage: 'programs',
    old: null,
    errors: null
  });
}); 
router.post('/superadmin/programs', validateProgram, handleValidation('layout', async (req) => ({
    title: 'Program | SMS',
    page: 'pages/superadmin/addProgram',
    activePage: 'programs'
})), 
  async (req, res) => {
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
    
    delCache(`all_programs`);

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
      listPrograms: programDtos,
      old: null,
      errors: null
    });
  } catch (error) {
    console.error('Error ambil Programs:', error);
    res.redirect(req.get('Referer'));
  }
});
router.post('/superadmin/outputs', validateOutput, handleValidation('layout', async (req) => {
    const token = req.session.user?.accessToken;
    const programDtos = await getAllPrograms(token);
    return{
      title: 'Tambah Output | SMS',
      page: 'pages/superadmin/addOutput',
      activePage: 'outputs',
      listPrograms: programDtos
    }
  }), 
  async (req, res) => {
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
      program: program
    };
    // Kirim ke API
    await axios.post(`${apiBaseUrl}/outputs`, requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    delCache(`all_outputs`);

    req.session.successMessage = 'Output berhasil ditambahkan.';
    res.redirect('outputs');
  } catch (error) {
    console.error('Gagal menyimpan output:', error.response ? error.response.data : error.message);
    
    req.session.errorMessage = 'Gagal menambahkan output.';
    res.redirect('outputs/add'); // balik ke halaman form
    
    // res.status(500).send('Internal Server Error');
  }
});

// Deputis
router.get('/superadmin/deputis', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const deputiDtos = await getAllDeputis(token);

    res.render('layout', {
      title: 'Deputi | SMS',
      page: 'pages/superadmin/manajemenDeputi',
      activePage: 'deputis',
      deputiDtos
    });
  } catch (error) {
    console.error('Error fetching deputis:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/superadmin/deputis/add', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    res.render('layout', {
      title: 'Tambah Deputi | SMS',
      page: 'pages/superadmin/addDeputi',
      activePage: 'deputis',
      old: null,
      errors: null
    });
  } catch (error) {
    res.redirect(req.get('Referer'));
  }
});
router.post('/superadmin/deputis', validateDeputi, handleValidation('layout', async (req) => {
    const token = req.session.user?.accessToken;
    return{
      title: 'Tambah Deputi | SMS',
      page: 'pages/superadmin/addDeputi',
      activePage: 'deputis'
    }
  }), 
  async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    // Ambil data dari form
    const { name, code } = req.body;

    // Siapkan request body
    const requestBody = {
      name,
      code
    };
    // Kirim ke API
    await axios.post(`${apiBaseUrl}/api/deputis`, requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    delCache(`all_deputis`);

    req.session.successMessage = 'Deputi berhasil ditambahkan.';
    res.redirect('/superadmin/deputis');
  } catch (error) {
    console.error('Gagal menyimpan deputi:', error.response ? error.response.data : error.message);
    
    req.session.errorMessage = 'Gagal menambahkan deputi.';
    res.redirect('deputis/add'); // balik ke halaman form
    
    // res.status(500).send('Internal Server Error');
  }
});

// Direktorats
router.get('/superadmin/direktorats', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const direktoratDtos = await getAllDirektorats(token);

    res.render('layout', {
      title: 'Direktorat | SMS',
      page: 'pages/superadmin/manajemenDirektorat',
      activePage: 'direktorats',
      direktoratDtos
    });
  } catch (error) {
    console.error('Error fetching direktorats:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/superadmin/direktorats/add', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }
    
    const deputiDtos = await getAllDeputis(token);

    res.render('layout', {
      title: 'Tambah Direktorat | SMS',
      page: 'pages/superadmin/addDirektorat',
      activePage: 'direktorats',
      listDeputis: deputiDtos,
      old: null,
      errors: null
    });
  } catch (error) {
    console.error('Error ambil Deputis:', error);
    res.redirect(req.get('Referer'));
  }
});
router.post('/superadmin/direktorats', validateDirektorat, handleValidation('layout', async (req) => {
    const token = req.session.user?.accessToken;
    const deputiDtos = await getAllDeputis(token);
    return{
      title: 'Tambah Direktorat | SMS',
      page: 'pages/superadmin/addDirektorat',
      activePage: 'direktorats',
      listDeputis: deputiDtos
    }
  }), 
  async (req, res) => {
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
    res.redirect('direktorats/add'); // balik ke halaman form
    
    // res.status(500).send('Internal Server Error');
  }
});

module.exports = router;