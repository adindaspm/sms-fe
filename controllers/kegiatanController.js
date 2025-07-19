const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');
const { getAllKegiatans, getKegiatanById } = require("../services/kegiatanService");
const { getAllOutputs } = require("../services/outputService");
const { getAllPrograms } = require("../services/programService");
const { getSatkerIdByName } = require("../services/satkerService");
const { delCache } = require("../utils/cacheService");

exports.index = async (req, res) => {
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
      page: 'pages/manajemenKegiatan',
      activePage: 'surveys',
      kegiatans  // Kirim data kegiatan ke view
    });
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    res.status(500).send('Internal Server Error');
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
    const satkerName = req.session.user ? req.session.user.namaSatker : null;

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
    console.error(error);
    res.status(500).send('Internal Server Error');
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
    console.error('Gagal ambil detail kegiatan:', error.message);
    res.redirect('/'); // fallback kalo error
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
    res.redirect('/'); // fallback kalo error
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
    req.session.successMessage = 'Berhasil menambah kegiatan.';
    res.redirect('/surveys');
  } catch (error) {
    console.error('Error saat tambah kegiatan:', error.response?.data || error.message);

    req.session.errorMessage = 'Gagal menambah kegiatan.';
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
    req.session.successMessage = 'Berhasil memperbarui status.';
    res.redirect(`/surveys/detail/${idKegiatan}`);
  } catch (error) {
    const { idKegiatan } = req.params;
    
    console.error('Error saat memperbarui status:', error.response?.data || error.message);

    req.session.errorMessage = 'Gagal memperbarui status.';
    res.redirect(`/surveys/detail/${idKegiatan}`);
    // res.status(500).send('Internal Server Error');

  }
};

exports.updateTanggalTahap = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;

    const { idKegiatan, idTahap, idSubTahap } = req.params;
    const tanggalRencana = new Date(req.body.tanggalRencana).toISOString().split('T')[0];

    await axios.post(`${apiBaseUrl}/api/tahap/${idKegiatan}/${idTahap}/${idSubTahap}/tanggal-perencanaan`, tanggalRencana, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    await delCache('all_kegiatans');
    await delCache(`kegiatan_${idKegiatan}`);
    await delCache(`statusTahapByKegiatan_${idKegiatan}`);
    req.session.successMessage = 'Berhasil memperbarui tanggal.';
  } catch (error) {
    const { idKegiatan } = req.params;
    
    console.error('Error saat memperbarui status:', error.response?.data || error.message);

    req.session.errorMessage = 'Gagal memperbarui tanggal.';
    res.status(500).send('Error', error);

  }
};