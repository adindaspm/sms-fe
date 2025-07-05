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

const { authMiddleware } = require('./middleware/authMiddleware');
const { loginAndSave } = require('./services/authService');
const { getUserByEmail } = require('./services/userService');

// Route files
const adminRoutes = require('./routes/admin');
const superadminRoutes = require('./routes/superadmin');
const operatorRoutes = require('./routes/operator');
const { getAllSatkers } = require('./services/satkerService');
const { getAllPrograms } = require('./services/programService');
const { validatePass } = require('./validators/passValidator');
const handleValidation = require('./middleware/handleValidation');

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
app.post('/login-user', async (req, res) => {
  const { email, password } = req.body;

  try {
    const loginResponse = await loginAndSave(email, password);
    const accessToken = loginResponse.accessToken;
    const userData = await getUserByEmail(email, accessToken);

    // Simpan semuanya ke session
    req.session.user = {
      idUser: userData.id,
      email: loginResponse.email,
      accessToken: accessToken,
      roles: loginResponse.roles,
      namaUser: userData.name,       // <-- nama user dari /users
      namaSatker: userData.namaSatker,
    };

    // Kalau sukses, langsung redirect ke /
    res.redirect('/');

  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
    
    res.redirect('/login?error=true');
  }
});

// Cek session user
app.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(401).json({ loggedIn: false, message: 'Not logged in' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.redirect('/login?logout=success');
  });
});

// Login Page
app.get('/login', (req, res) => {
  res.render('pages/login', { title: 'Login | SMS' });
});

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
    totalSurvei: 42,
    surveiProses: 23,
    surveiSelesai: 12,
    surveiTerlambat: 7,
    faseLabels: ['Specify Needs', 'Design', 'Build', 'Collect', 'Process', 'Analyse', 'Disseminate', 'Evaluate'],
    faseData: [10, 12, 15, 18, 13, 8, 5, 3],
    listSurvei: [
      { nama: 'Survei A', progress: 60, status: 'Sedang Analisis', satker: 'BPS Sumbar' }
    ],
    dokumenList: [
      { namaSurvei: 'Survei A', fase: 'Disseminate', status: 'OK' }
    ],
    activityLogs: [
      { tanggal: '29 Juni', keterangan: 'Survei A update ke fase 5 oleh BPS Jakarta Barat' }
    ]
  });
})

// Modular routes
app.use(adminRoutes);
app.use(superadminRoutes);
app.use(operatorRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
