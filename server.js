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
const generalRoutes = require('./routes/generalRoutes');
const kegiatanRoutes = require('./routes/kegiatanRoutes');
const outputRoutes = require('./routes/outputRoutes');
const programRoutes = require('./routes/programRoutes');
const provinceRoutes = require('./routes/provinceRoutes');
const roleRoutes = require('./routes/roleRoutes');
const satkerRoutes = require('./routes/satkerRoutes');
const userRoutes = require('./routes/userRoutes');


const { getAllSatkers } = require('./services/satkerService');
const { getAllPrograms } = require('./services/programService');
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

// Routes
app.use('/', authRoutes);
app.use('/', generalRoutes); 
app.use('/deputis', checkRole(['ROLE_SUPERADMIN']), deputiRoutes);
app.use('/direktorats', checkRole(['ROLE_SUPERADMIN']), direktoratRoutes);
app.use('/outputs', checkRole(['ROLE_SUPERADMIN']), outputRoutes);
app.use('/programs', checkRole(['ROLE_SUPERADMIN']), programRoutes);
app.use('/provinces', checkRole(['ROLE_SUPERADMIN']), provinceRoutes);
app.use('/roles', checkRole(['ROLE_SUPERADMIN']), roleRoutes);
app.use('/satkers', checkRole(['ROLE_SUPERADMIN']), satkerRoutes);
app.use('/users', checkRole(['ROLE_SUPERADMIN', 'ROLE_ADMIN']), userRoutes);
app.use('/surveys', checkRole(['ROLE_OPERATOR']), kegiatanRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running...`);
});
