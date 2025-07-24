const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { apiBaseUrl } = require('../config');
const kegiatanService = require('../services/kegiatanService');
const { getAllKegiatans, getFilteredKegiatans, getKegiatanById, getFileTahapByKegiatanId } = require("../services/kegiatanService");
const { getAllOutputs } = require("../services/outputService");
const { getAllPrograms } = require("../services/programService");
const { getSatkerIdByName } = require("../services/satkerService");
const { delCache } = require("../utils/cacheService");
const dayjs = require('dayjs');

exports.index = async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    const namaUserLogin = req.session.user ? req.session.user.namaUser : null;
    const direktoratId = req.session.user ? req.session.user.direktoratId : null;
    if (!token || !namaUserLogin) {
      return res.redirect('/login');
    }

    const kegiatans = await getFilteredKegiatans(direktoratId, token);

    // Kirim data ke halaman dengan 'kegiatans'
    res.render('layout', {
      title: 'Kegiatan | SMS',
      page: 'pages/manajemenKegiatan',
      activePage: 'surveys',
      kegiatans  // Kirim data kegiatan ke view
    });
  } catch (error) {
    console.error('Error fetching kegiatan:', error.status, ' ', error.data.message);
    req.session.errorMessage = 'Terjadi kesalahan server! Gagal mengambil data.'
    res.redirect('/');
  }
};

exports.renderAddForm = async (req) => {
  const token = req.session.user?.accessToken;
  const programDtos = await getAllPrograms(token);
  const userId = req.session.user ? req.session.user.idUser : null;
  const userName = req.session.user ? req.session.user.namaUser : null;
  const satkerName = req.session.user ? req.session.user.namaSatker : null;
  const satkerId = await getSatkerIdByName(satkerName, token);
  return {
    title: 'Tambah Kegiatan | SMS',
    page: 'pages/addKegiatan', 
    activePage: 'surveys',
    programDtos,
    userName,
    userId,
    satkerName,
    satkerId,
  }
}
exports.addForm = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const programDtos = await getAllPrograms(token);
    const userId = req.session.user ? req.session.user.idUser : null;
    const userName = req.session.user ? req.session.user.namaUser : null;
    const satkerName = req.session.user ? req.session.user.satkerName : null;

    // Cari ID Satker berdasarkan nama
    const satkerId = await getSatkerIdByName(satkerName, token);

    res.render('layout', {
      title: 'Tambah Kegiatan | SMS',
      page: 'pages/addKegiatan', 
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
    console.error('Gagal membuka form tambah kegiatan:', error.message);
    req.session.errorMessage = 'Gagal memuat form! Coba lagi nanti.';
    res.redirect('/surveys'); // fallback kalo error
  }
};

exports.save = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;

    const {
      name,
      output,
      code,
      startDate,
      endDate,
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
    res.redirect('/surveys');
  } catch (error) {
    console.error('Error saat tambah kegiatan:', error.response?.data || error.message);

    req.session.errorMessage = 'Gagal menambah kegiatan.';
    res.redirect('/surveys/add');
    // res.status(500).send('Internal Server Error');

  }
};

exports.detail = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const { id } = req.params;
    const kegiatan = await getKegiatanById(id, token);

    res.render('layout', {
      title: 'Detail Kegiatan | SMS',
      page: 'pages/kegiatan/detailKegiatanAuto',
      activePage: 'surveys',
      kegiatan
    });
  } catch (error) {
    req.session.errorMessage = 'Terjadi masalah pada server. Coba lagi nanti!';
    console.error('Gagal ambil detail kegiatan:', error.message);
    res.redirect('/surveys'); // fallback kalo error
  }
};

exports.renderUpdateForm = async (req) => {
  const { id } = req.params;
  const token = req.session.user?.accessToken;

  const kegiatan = await getKegiatanById(id, token);
  const programDtos = await getAllPrograms(token);
  
  return {
    title: 'Update Kegiatan | SMS',
    page: 'pages/updateKegiatan',
    activePage: 'surveys',
    programDtos,
    kegiatan
  }
}

exports.updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.session.user?.accessToken;

    const kegiatan = await getKegiatanById(id, token);
    const programDtos = await getAllPrograms(token);
    const outputDtos = await getAllOutputs(token);

    res.render('layout', {
      title: 'Update Kegiatan | SMS',
      page: 'pages/updateKegiatan',
      activePage: 'surveys',
      programDtos,
      kegiatan,
      old: null,
      errors: null
    });
  } catch (error) {
    console.error('Gagal ambil detail kegiatan:', error.message);
    req.session.errorMessage = 'Gagal ambil data kegiatan';
    res.redirect('/surveys'); // fallback kalo error
    // res.status(500).send('Internal Server Error');

  }
};

exports.update = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const { id } = req.params;
    const {
      name,
      output,
      code,
      startDate,
      endDate,
      userId
    } = req.body;

    const tahun = dayjs(startDate).format('YYYY');    
    const now = new Date().toISOString();

    await axios.patch(`${apiBaseUrl}/api/kegiatans/${id}`, {
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

    await delCache('all_kegiatans');
    await delCache(`kegiatan_${id}`)
    req.session.successMessage = 'Berhasil memperbarui kegiatan.';
    res.redirect('/surveys');
  } catch (error) {
    console.error('Error saat update kegiatan:', error.response?.data || error.message);

    req.session.errorMessage = 'Gagal memperbarui kegiatan.';
    res.redirect('/surveys/add');
    // res.status(500).send('Internal Server Error');

  }
};

exports.updateTahap = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;

    const { idKegiatan, idTahap, idSubTahap } = req.params;

    await axios.post(`${apiBaseUrl}/api/tahap/${idKegiatan}/${idTahap}/${idSubTahap}`, true, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    await delCache('all_kegiatans');
    await delCache(`kegiatan_${idKegiatan}`);
    await delCache(`statusTahapByKegiatan_${idKegiatan}`);
    // req.session.successMessage = 'Berhasil memperbarui status.';
    return res.status(200).json({ success: true, message: 'Berhasil memperbarui status.' });
  } catch (error) {
    const { idKegiatan } = req.params;
    
    console.error('Error saat memperbarui status:', error.response?.data || error.message);

    // req.session.errorMessage = 'Gagal memperbarui status.';
    return res.status(500).json({ success: false, message: 'Gagal memperbarui status.' });
  }
};

exports.completeTahap = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;

    const { idKegiatan, idTahap } = req.params;

    await axios.post(`${apiBaseUrl}/api/tahap/${idKegiatan}/${idTahap}/complete`, true, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    await delCache('all_kegiatans');
    await delCache(`kegiatan_${idKegiatan}`);
    await delCache(`statusTahapByKegiatan_${idKegiatan}`);
    // req.session.successMessage = 'Berhasil memperbarui status.';
    return res.status(200).json({ success: true, message: 'Berhasil memperbarui status.' });
  } catch (error) {
    const { idKegiatan } = req.params;
    
    console.error('Error saat memperbarui status:', error.response?.data || error.message);

    // req.session.errorMessage = 'Gagal memperbarui status.';
    return res.status(500).json({ success: false, message: 'Gagal memperbarui status.' });
  }
};

exports.updateTanggalTahap = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;

    const { idKegiatan, idTahap, idSubTahap } = req.params;
    
    const [day, month, year] = req.body.tanggalRencana.split('-');
    const tanggalRencana = `${year}-${month}-${day}`;

// Kirim string tanggalRencana ke backend sebagai "2025-07-19"

    await axios.post(`${apiBaseUrl}/api/tahap/${idKegiatan}/${idTahap}/${idSubTahap}/tanggal-perencanaan`, tanggalRencana, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    await delCache('all_kegiatans');
    await delCache(`kegiatan_${idKegiatan}`);
    await delCache(`statusTahapByKegiatan_${idKegiatan}`);
    // req.session.successMessage = 'Berhasil memperbarui tanggal.';
    res.sendStatus(200);
  } catch (error) {
    const { idKegiatan } = req.params;
    
    console.error('Error saat menginput tanggal rencana:', error.response?.data || error.message);

    req.session.errorMessage = 'Gagal memperbarui tanggal.';
    res.status(500).send('Error', error);

  }
};

exports.uploadFile = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;

    const { idKegiatan, idTahap } = req.params;
    
    const uploadedFile = req.file;

    if (!uploadedFile) {
      req.session.errorMessage = 'File tidak ditemukan dalam permintaan.';
      return res.redirect(`/surveys/detail/${idKegiatan}`);
    }

    // Siapkan form-data
    const form = new FormData();
    form.append('file', fs.createReadStream(uploadedFile.path), uploadedFile.originalname);

    // Kirim ke API
    await axios.post(`${apiBaseUrl}/api/tahap/${idKegiatan}/${idTahap}/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    await delCache('all_kegiatans');
    await delCache(`kegiatan_${idKegiatan}`);
    await delCache(`statusTahapByKegiatan_${idKegiatan}`);
    req.session.successMessage = 'Berhasil mengupload file.';
    res.redirect(`/surveys/detail/${idKegiatan}`);
  } catch (error) {
    const { idKegiatan } = req.params;
    
    console.error('Error upload file:', error.response?.data || error.message);

    req.session.errorMessage = 'Terjadi kesalahan pada server. Coba lagi nanti!';
    res.redirect(`/surveys/detail/${idKegiatan}`);
    // res.status(500).send('Internal server error');

  }
};

exports.downloadFile = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const { idKegiatan, idTahap } = req.params;

    const { stream, latestFileName } = await getFileTahapByKegiatanId(idKegiatan, idTahap, token);
    
    // Tentukan ekstensi mime jika perlu, contoh untuk PDF:
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${latestFileName}"`);

    stream.pipe(res);
  } catch (error) {
    console.error('Error download file:', error.response?.data || error.message);
    req.session.errorMessage = 'Gagal mendownload file.';
    res.redirect(`/surveys/detail/${req.params.idKegiatan}`);
  }
};

exports.getKegiatanSummary = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;

    const kegiatans = await kegiatanService.getAllKegiatansWithStatus(token);

    const summary = {
      total: kegiatans.length,
      status: await kegiatanService.countKategoriStatus(kegiatans),
      perFase: await kegiatanService.countByKategoriTahap(kegiatans),
      perDirektorat: kegiatanService.countByDirektorat(kegiatans),
      perProgram: kegiatanService.countByProgram(kegiatans),
      perOutput: kegiatanService.countByOutput(kegiatans),
      perSatker: kegiatanService.countBySatker(kegiatans),
      perTahun: kegiatanService.countByYear(kegiatans),
      perBulan: kegiatanService.countByMonth(kegiatans)
    };

    res.json(summary);
  } catch (error) {
    console.error('Gagal ambil ringkasan kegiatan:', error.message);
    res.status(500).json({ message: 'Gagal ambil ringkasan kegiatan' });
  }
};
