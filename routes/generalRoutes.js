const express = require('express');
const router = express.Router();

const { validatePass } = require('../validators/passValidator');
const handleValidation = require('../middleware/handleValidation');
const kegiatanController = require('../controllers/kegiatanController');
const { getAllKegiatans } = require('../services/kegiatanService');
const { getAllSatkers } = require('../services/satkerService');
const { getAllPrograms } = require('../services/programService');
const { getAllDirektorats } = require('../services/direktoratService');
const { getAllOutputs } = require('../services/outputService');

// Dashboard
router.get('/summaryKegiatan', kegiatanController.getKegiatanSummary);

router.get('/', async (req, res) => {
  const token = req.session.user ? req.session.user.accessToken : null;
  const labelsSatker = ['BPS A', 'BPS B', 'BPS C'];
  const dataSatker = [10, 20, 30];
  const hasDataSatker = true;

  res.render('layout', {
    title: 'Dashboard | SMS',
    page: 'pages/dashboard',
    activePage: 'dashboard',
    labelsSatker,dataSatker,hasDataSatker,
      years: [2023, 2024, 2025],
      selectedYear: 2025,
      outputs: await getAllOutputs(token),
      selectedOutput: null,
      direktorats: await getAllDirektorats(token),
      selectedDirektorat: '',
  });
});

// Cek session user
router.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(401).json({ loggedIn: false, message: 'Not logged in' });
  }
});

// Profil
router.get('/profil', (req, res) => {
  res.render('layout', {
    title: 'Profil | SMS',
    page: 'pages/detailProfil',
    activePage: null,
  });
});

// FAQ
router.get('/faq', (req, res) => {
  res.render('layout', {
    title: 'FAQ | SMS',
    page: 'pages/faq',
    activePage: 'faq'
  });
});

// Ubah Password
router.get('/changePass', (req, res) => {

  res.render('layout', {
    title: 'Ubah Password | SMS',
    page: 'pages/ubahPassword',
    activePage: '',
    old: null, 
    errors: null
  });
});
router.post('/changePass', validatePass, handleValidation('layout', async (req) => {
    return{
      title: 'Ubah Password | SMS',
      page: 'pages/ubahPassword',
      activePage: ''
    };
  }),
  async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { passlama, passbaru, confirmPass } = req.body;
    
    const payload = {
      oldPassword : passlama,
      newPassword : passbaru
    };
    
    await axios.post(`${apiBaseUrl}/api/auth/change-password`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    req.session.successMessage = 'Berhasil mengganti password.';
    res.redirect('/profil');
  } catch (error) {
    console.error('Error mengganti password:', error?.response?.data || error.message);

    if (error?.response?.status === 400) {
      req.session.errorMessage = 'Password lama yang dimaksudkan salah.';

      // Render langsung halaman dengan error dan old data
      res.render('layout', {
        title: 'Ubah Password | SMS',
        page: 'pages/ubahPassword',
        activePage: '',
        errors: [{ msg: 'Password lama salah.', path: 'passlama' }],
        old: req.body
      });
    } else {
      req.session.errorMessage = 'Gagal memperbarui password.';
      res.redirect('/profil');
    }
  }
});

router.get('/dashboardcoba', async (req, res) => {
  const token = req.session.user?.accessToken;
  const kegiatanDtos = await getAllKegiatans(token);
  const totalSurvei = kegiatanDtos.length;
  const isCompleted = (percentage) => percentage === 100;
  const surveiDalamProgres = kegiatanDtos.filter(k => {
    const status = k.statusTahap || {};
    return !(
      isCompleted(status.tahap1Percentage) &&
      isCompleted(status.tahap2Percentage) &&
      isCompleted(status.tahap3Percentage) &&
      isCompleted(status.tahap4Percentage) &&
      isCompleted(status.tahap5Percentage) &&
      isCompleted(status.tahap6Percentage) &&
      isCompleted(status.tahap7Percentage) &&
      isCompleted(status.tahap8Percentage)
    );
  }).length;
  const surveiSelesai = kegiatanDtos.length - surveiDalamProgres;
  const today = new Date();
  const surveiTerlambat = kegiatanDtos.filter(k => {
    const selesai = (
      isCompleted(k.statusTahap?.tahap8Percentage)
    );
    const endDate = new Date(k.endDate);
    return !selesai && endDate < today;
  }).length;
  const getCurrentTahap = (statusTahap) => {
    if (!statusTahap) return null;
    for (let i = 1; i <= 8; i++) {
      if (!isCompleted(statusTahap[`tahap${i}Percentage`])) {
        return `tahap${i}`;
      }
    }
    return "Selesai";
  };

  const faseMap = {};
  kegiatanDtos.forEach(k => {
    const fase = getCurrentTahap(k.statusTahap) || "Tidak Diketahui";
    faseMap[fase] = (faseMap[fase] || 0) + 1;
  });
  const deputiMap = {};
  kegiatanDtos.forEach(k => {
    const deputi = k.namaDeputiPJ || "Tidak Diketahui";
    deputiMap[deputi] = (deputiMap[deputi] || 0) + 1;
  });

  res.render('layout', {
    title: 'Dashboard | SMS',
    page: 'pages/dashboardcoba',
    activePage: 'dashboard',
    years: [2023, 2024, 2025],
    selectedYear: 2025,
    satkers: await getAllSatkers(token),
    selectedSatker: null,
    programs: await getAllPrograms(token),
    selectedProgram: null,
    direktorats: await getAllDirektorats(token),
    selectedDirektorat: '',
    // statisticsDirektorat: await getStatisticsDirektorat(token), 
    // statisticsDeputi: await getStatisticsDeputi(token), 
    totalSurvei: totalSurvei,
    surveiProses: surveiDalamProgres,
    surveiSelesai: surveiSelesai,
    surveiTerlambat: surveiTerlambat,
    faseLabels: ['Specify Needs', 'Design', 'Build', 'Collect', 'Process', 'Analyse', 'Disseminate', 'Evaluate', 'Selesai'],
    faseData: [10, 12, 15, 18, 13, 8, 5, 3],
    faseMap,
    deputiMap,
    listSurvei: kegiatanDtos,
    dokumenList: [
      { namaSurvei: 'Survei A', fase: 'Disseminate', status: 'OK' }
    ],
    activityLogs: [
      { tanggal: '29 Juni', keterangan: 'Survei A update ke fase 5 oleh BPS Jakarta Barat' }
    ]
  });
});

router.post('/set-success-message', (req, res) => {
  req.session.successMessage = req.body.message || 'Berhasil';
  res.sendStatus(200);
});

router.post('/set-error-message', (req, res) => {
  req.session.errorMessage = req.body.message || 'Gagal';
  res.sendStatus(200);
});

module.exports = router;