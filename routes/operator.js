const express = require('express');
const axios = require('axios');
const router = express.Router();
const { apiBaseUrl } = require('../config');
const { getSatkerIdByName } = require('../utils/helpers');
const { getAllKegiatans, getKegiatanById } = require('../services/kegiatanService');
const { getAllPrograms } = require('../services/programService');
const { getAllSatkers } = require('../services/satkerService');
const { getAllOutputs, getOutputsByProgramId } = require('../services/outputService');
const { validateKegiatan } = require('../validators/kegiatanValidator');
const handleValidation = require('../middleware/handleValidation');
const { delCache } = require('../utils/cacheService');
const dayjs = require('dayjs');

// Surveys
router.get('/operator/surveys', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    const namaUserLogin = req.session.user ? req.session.user.namaUser : null;

    if (!token || !namaUserLogin) {
      return res.redirect('/login');
    }

    const kegiatans = await getAllKegiatans(token);

    // Kirim data ke halaman dengan 'kegiatans'
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
    const programDtos = await getAllPrograms(token);
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
      userName,
      userId,
      satkerName,
      satkerId,
      old: null,
      errors: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
// Ambil listOutputs dari suatu program
router.get('/operator/programs/:id/outputs', async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const programId = req.params.id;

    const outputs = await getOutputsByProgramId(programId, token);
    res.json(outputs);
  } catch (err) {
    console.error('Gagal ambil output:', err.message);
    res.status(500).json({ message: 'Gagal ambil output' });
  }
});
router.get('/operator/surveys/detail/1', async (req, res) => {
  const token = req.session.user?.accessToken;

  try {
    const kegiatan = await getKegiatanById(1, token);

    res.render('layout', {
      title: 'Detail Kegiatan | SMS',
      page: 'pages/operator/kegiatan/detailKegiatanAuto',
      activePage: 'surveys',
      kegiatan
    });
  } catch (error) {
    console.error('Gagal ambil detail kegiatan:', error.message);
    res.redirect('/'); // fallback kalo error
  }
});
router.post('/operator/surveys', validateKegiatan, handleValidation('layout', async (req) => {
  const token = req.session.user?.accessToken;
  const userId = req.session.user ? req.session.user.idUser : null;
  const userName = req.session.user ? req.session.user.namaUser : null;
  const satkerName = req.session.user ? req.session.user.namaSatker : null;
  const satkerId = await getSatkerIdByName(satkerName, token);

  const [listSatkers, programDtos] = await Promise.all([
    getAllSatkers(token),
    getAllPrograms(token)
  ]);
  return { 
      title: 'Tambah Kegiatan | SMS',
      page: 'pages/operator/addKegiatan', 
      activePage: 'surveys',
      listSatkers, 
      programDtos,
      userId,
      userName,
      satkerId,
      satkerName 
    };
}),
 async (req, res) => {
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

    delCache('all_kegiatans');
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
    const kegiatan = await getKegiatanById(id, token);
    const programDtos = await getAllPrograms(token);
    const outputDtos = await getAllOutputs(token);

    res.render('layout', {
      title: 'Update Kegiatan | SMS',
      page: 'pages/operator/updateKegiatan',
      activePage: 'surveys',
      programDtos,
      kegiatan,
      old: null,
      errors: null
    });
  } catch (error) {
    console.error('Gagal ambil detail kegiatan:', error.message);
    req.session.errorMessage = 'Gagal ambil data kegiatan';
    res.redirect('/'); // fallback kalo error
    // res.status(500).send('Internal Server Error');

  }
});
router.post('/operator/tahap/:idKegiatan/:idTahap/:idSubTahap', async (req, res) => {
  try {
    const token = req.session.user?.accessToken;

    const { idKegiatan, idTahap, idSubTahap } = req.params;

    await axios.post(`${apiBaseUrl}/api/tahap/${idKegiatan}/${idTahap}/${idSubTahap}`, true, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    delCache('all_kegiatans');
    delCache(`kegiatan_${idKegiatan}`);
    delCache(`statusTahapByKegiatan_${idKegiatan}`);
    req.session.successMessage = 'Berhasil memperbarui status.';
    res.redirect(`/operator/surveys/detail/${idKegiatan}`);
  } catch (error) {
    const { idKegiatan } = req.params;
    
    console.error('Error saat memperbarui status:', error.response?.data || error.message);

    req.session.errorMessage = 'Gagal memperbarui status.';
    res.redirect(`/operator/surveys/detail/${idKegiatan}`);
    // res.status(500).send('Internal Server Error');

  }
});


module.exports = router;