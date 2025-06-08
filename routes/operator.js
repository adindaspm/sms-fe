const express = require('express');
const axios = require('axios');
const router = express.Router();
const { apiBaseUrl } = require('../config');

// Surveys
router.get('/operator/surveys', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    const namaUserLogin = req.session.user ? req.session.user.namaUser : null;

    if (!token || !namaUserLogin) {
      return res.redirect('/login');
    }

    const response = await axios.get(`${apiBaseUrl}/kegiatans`, {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    let kegiatanDtos = response.data._embedded.kegiatans;

    // Filter kegiatan yang namaUser-nya sama dengan user yang login
    kegiatanDtos = kegiatanDtos.filter(kegiatan => kegiatan.namaUser === namaUserLogin);

    const kegiatans = kegiatanDtos.map((kegiatan) => {
      const href = kegiatan._links?.self?.href || '';
      const idMatch = href.match(/\/kegiatans\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        name: kegiatan.name,
        namaUser: kegiatan.namaUser,
        namaSatker: kegiatan.namaSatker,
      };
    });
    // Kirim data ke halaman dengan 'kegiatanDtos'
    res.render('layout', {
      title: 'Kegiatan | SMS',
      page: 'pages/operator/manajemenKegiatan',
      activePage: 'surveys',
      kegiatans  // Kirim data kegiatan ke view
    });
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/operator/surveys/add', async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const programsResponse = await axios.get(`${apiBaseUrl}/programs`, {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const outputsResponse = await axios.get(`${apiBaseUrl}/outputs`, {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    let programDtos = programsResponse.data._embedded.programs || [];
    let outputDtos = outputsResponse.data._embedded.outputs || [];

    programDtos = programDtos.map(program => {
      const href = program._links?.self?.href || '';
      const idMatch = href.match(/\/programs\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        href, 
        id,
        year: program.year,
        code: program.code,
        name: program.name
      };
    });
    outputDtos = outputDtos.map(output => {
      const href = output._links?.self?.href || '';
      const idMatch = href.match(/\/outputs\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        href, 
        id,
        ...output
      };
    });

    const userId = req.session.user ? req.session.user.idUser : null;
    const userName = req.session.user ? req.session.user.namaUser : null;
    const satkerName = req.session.user ? req.session.user.namaSatker : null;

    // Cari ID Satker berdasarkan nama
    const satkerId = await getSatkerIdByName(satkerName, token);

    res.render('layout', {
      title: 'Tambah Kegiatan | SMS',
      page: 'pages/operator/addKegiatan', 
      activePage: 'surveys',
      programDtos,
      outputDtos,
      userName,
      userId,
      satkerName,
      satkerId
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/operator/surveys/detail/:id', async (req, res) => {
  const { id } = req.params;
  const token = req.session.user?.accessToken;

  try {
    const response = await axios.get(`${apiBaseUrl}/kegiatans/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const kegiatan = response.data; // data kegiatan per ID

    res.render('layout', {
      title: 'Detail Kegiatan | SMS',
      page: 'pages/operator/detailKegiatan',
      activePage: 'surveys',
      id,
      kegiatan // kirim data kegiatan ke halaman
    });
  } catch (error) {
    console.error('Gagal ambil detail kegiatan:', error.message);
    res.redirect('/'); // fallback kalo error
  }
});
router.post('/operator/surveys', async (req, res) => {
  try {
    const token = req.session.user?.accessToken;

    const {
      name,
      program,
      output,
      code,
      startDate,
      endDate,
      satkerId,
      userId
    } = req.body;

    const tahun = dayjs(startDate).format('YYYY');    
    const now = new Date().toISOString();

    await axios.post(`${apiBaseUrl}/api/kegiatans`, {
      name,
      code,
      user: {id:Number(userId)},
      output: {id:Number(output)},
      startDate,
      endDate,
      createdOn: now,
      updatedOn: null,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    req.session.successMessage = 'Berhasil menambah kegiatan.';
    res.redirect('/operator/surveys');
  } catch (error) {
    console.error('Error saat tambah kegiatan:', error.response?.data || error.message);

    req.session.errorMessage = 'Gagal menambah kegiatan.';
  res.redirect('/operator/surveys/add');
    // res.status(500).send('Internal Server Error');

  }
});
router.get('/operator/surveys/:id/update', async (req, res) => {
  const { id } = req.params;
  const token = req.session.user?.accessToken;

  try {
    const response = await axios.get(`${apiBaseUrl}/kegiatans/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const kegiatan = response.data; // data kegiatan per ID
    const programsResponse = await axios.get(`${apiBaseUrl}/programs`, {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const outputsResponse = await axios.get(`${apiBaseUrl}/outputs`, {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    let programDtos = programsResponse.data._embedded.programs || [];
    let outputDtos = outputsResponse.data._embedded.outputs || [];

    programDtos = programDtos.map(program => {
      const href = program._links?.self?.href || '';
      const idMatch = href.match(/\/programs\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        href, 
        id,
        year: program.year,
        code: program.code,
        name: program.name
      };
    });
    outputDtos = outputDtos.map(output => {
      const href = output._links?.self?.href || '';
      const idMatch = href.match(/\/outputs\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        href, 
        id,
        ...output
      };
    });

    // Cari ID Satker berdasarkan nama
    // const satkerId = await getSatkerIdByName(satkerName, token);

    res.render('layout', {
      title: 'Update Kegiatan | SMS',
      page: 'pages/operator/updateKegiatan',
      activePage: 'surveys',
      id,
      programDtos,
      outputDtos,
      kegiatan // kirim data kegiatan ke halaman
    });
  } catch (error) {
    console.error('Gagal ambil detail kegiatan:', error.message);
    req.session.errorMessage = 'Gagal ambil data kegiatan';
    res.redirect('/'); // fallback kalo error
    // res.status(500).send('Internal Server Error');

  }
});

router.get('/operator/cobasurveys/detail/1', async (req, res) => {
  const { id } = req.params;
  const token = req.session.user?.accessToken;

  try {
    const response = await axios.get(`${apiBaseUrl}/kegiatans/1`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const kegiatan = response.data; // data kegiatan per ID

    res.render('layout', {
      title: 'Detail Kegiatan | SMS',
      page: 'pages/operator/kegiatan/detailKegiatanAuto',
      activePage: 'surveys',
      id,
      kegiatan // kirim data kegiatan ke halaman
    });
  } catch (error) {
    console.error('Gagal ambil detail kegiatan:', error.message);
    res.redirect('/'); // fallback kalo error
  }
});

module.exports = router;