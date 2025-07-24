require('dotenv').config();
const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { apiBaseUrl } = require('./config');

const app = express();
const port = 3000;

const dayjs = require('dayjs');

const { authMiddleware, checkRole } = require('./middleware/authMiddleware');
const { loginAndSave } = require('./services/authService');
const { getUserByEmail } = require('./services/userService');

// Route files
const authRoutes = require('./routes/authRoutes');
const deputiRoutes = require('./routes/deputiRoutes');
const direktoratRoutes = require('./routes/direktoratRoutes');
const kegiatanRoutes = require('./routes/kegiatanRoutes');
const outputRoutes = require('./routes/outputRoutes');
const programRoutes = require('./routes/programRoutes');
const provinceRoutes = require('./routes/provinceRoutes');
const roleRoutes = require('./routes/roleRoutes');
const satkerRoutes = require('./routes/satkerRoutes');
const userRoutes = require('./routes/userRoutes');
// const adminRoutes = require('./routes/admin');
// const superadminRoutes = require('./routes/superadmin');
// const operatorRoutes = require('./routes/operator');
const { getAllSatkers } = require('./services/satkerService');
const { getAllPrograms } = require('./services/programService');
const { validatePass } = require('./validators/passValidator');
const handleValidation = require('./middleware/handleValidation');
const { getAllKegiatans, getStatisticsDirektorat, getStatisticsDeputi } = require('./services/kegiatanService');
const { getAllDirektorats } = require('./services/direktoratService');

// Set view engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session config
app.use(session({
  secret: 'sms',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Kalau HTTPS, set ke true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication and role-check middleware
app.use(authMiddleware);

// Apply middleware ke semua route untuk cek autentikasi login
app.use((req, res, next) => {
  const publicPaths = ['/login-user', '/login']; // bebas tambah
  // Kalau user sudah login, set variabel untuk di EJS
  res.locals.loggedInUser = req.session.user || null;
  res.locals.successMessage = req.session.successMessage;
  res.locals.errorMessage = req.session.errorMessage;
  delete req.session.successMessage;
  delete req.session.errorMessage;
  
  if (publicPaths.includes(req.path)) {
    next(); // allow akses
  } else if (req.session.user && req.session.user.accessToken) {
    next(); // allow akses
  } else {
    res.redirect('/login');
  }
});

// Route
// Dashboard
app.get('/', (req, res) => {
  const labelsSatker = ['BPS A', 'BPS B', 'BPS C'];
  const dataSatker = [10, 20, 30];
  const hasDataSatker = true;

  res.render('layout', {
    title: 'Dashboard | SMS',
    page: 'pages/dashboard',
    activePage: 'dashboard',
    labelsSatker,dataSatker,hasDataSatker
  });
});

// Route untuk login user
// app.post('/login-user', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const loginResponse = await loginAndSave(email, password);
//     const accessToken = loginResponse.accessToken;
//     const userData = await getUserByEmail(email, accessToken);

//     // Simpan semuanya ke session
//     req.session.user = {
//       idUser: userData.id,
//       email: loginResponse.email,
//       accessToken: accessToken,
//       roles: loginResponse.roles,
//       namaUser: userData.name,       // <-- nama user dari /users
//       namaSatker: userData.namaSatker,
//     };

//     // Kalau sukses, langsung redirect ke /
//     res.redirect('/');

//   } catch (error) {
//     console.error('Login failed:', error.response ? error.response.data : error.message);
    
//     res.redirect('/login?error=true');
//   }
// });

// Cek session user
app.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(401).json({ loggedIn: false, message: 'Not logged in' });
  }
});

// // Logout
// app.post('/logout', (req, res) => {
//   req.session.destroy(err => {
//     if (err) {
//       return res.status(500).json({ message: 'Logout failed' });
//     }
//     res.redirect('/login?logout=success');
//   });
// });

// // Login Page
// app.get('/login', (req, res) => {
//   res.render('pages/login', { title: 'Login | SMS' });
// });

// Profil
app.get('/profil', (req, res) => {
  res.render('layout', {
    title: 'Profil | SMS',
    page: 'pages/detailProfil',
    activePage: null,
  });
});

// FAQ
app.get('/faq', (req, res) => {
  res.render('layout', {
    title: 'FAQ | SMS',
    page: 'pages/faq',
    activePage: 'faq'
  });
});

// Ubah Password
app.get('/changePass', (req, res) => {

  res.render('layout', {
    title: 'Ubah Password | SMS',
    page: 'pages/ubahPassword',
    activePage: '',
    old: null, 
    errors: null
  });
});
app.post('/changePass', validatePass, handleValidation('layout', async (req) => {
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

app.get('/dashboardcoba', async (req, res) => {
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
    statisticsDirektorat: await getStatisticsDirektorat(token), 
    statisticsDeputi: await getStatisticsDeputi(token), 
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
app.post('/set-success-message', (req, res) => {
  req.session.successMessage = req.body.message || 'Berhasil disimpan';
  res.sendStatus(200);
});
app.post('/set-error-message', (req, res) => {
  req.session.errorMessage = req.body.message || 'Gagal';
  res.sendStatus(500);
});

// Modular routes
app.use(authRoutes);
app.use('/deputis', checkRole(['ROLE_SUPERADMIN']), deputiRoutes);
app.use('/direktorats', checkRole(['ROLE_SUPERADMIN']), direktoratRoutes);
app.use('/outputs', checkRole(['ROLE_SUPERADMIN']), outputRoutes);
app.use('/programs', checkRole(['ROLE_SUPERADMIN']), programRoutes);
app.use('/provinces', checkRole(['ROLE_SUPERADMIN']), provinceRoutes);
app.use('/roles', checkRole(['ROLE_SUPERADMIN']), roleRoutes);
app.use('/satkers', checkRole(['ROLE_SUPERADMIN']), satkerRoutes);
app.use('/users', checkRole(['ROLE_SUPERADMIN', 'ROLE_ADMIN']), userRoutes);
app.use('/surveys', checkRole(['ROLE_OPERATOR']), kegiatanRoutes);
// app.use(adminRoutes);
// app.use(superadminRoutes);
// app.use(operatorRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running...`);
});
