const express = require('express');
const session = require('express-session');
const axios = require('axios');
const app = express();
const path = require('path');
const port = 3000;
const dayjs = require('dayjs');

// Function
function parseIdFromLink(href) {
  if (!href) return null;
  const match = href.match(/\/(\d+)(\?.*)?$/); // ambil angka di akhir URL
  return match ? match[1] : null;
}

function checkRole(allowedRoles) {
  return (req, res, next) => {
    const user = req.session.user;

    if (!user || !user.roles || !allowedRoles.some(role => user.roles.includes(role))) {
      return res.status(403).send('Akses ditolak: tidak memiliki izin.');
    }

    next(); // lanjut ke route handler
  };
}

async function getSatkerIdByName(query, token) {
  try {
    const sanitizedName = query.replace(/^Badan Pusat Statistik\s*/, '');
    const response = await axios.get(`http://localhost/satkers/search/searchSatker?query=${sanitizedName}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let satkers = response.data._embedded.satkers;
    satkers = satkers.map(satker => {
      const href = satker._links?.self?.href || '';
      const idMatch = href.match(/\/satkers\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        href, 
        id,
        ...satker
      };
    });
    if (satkers.length > 0) {
      // Kembaliin ID satker pertama yang ditemukan (kamu bisa sesuaikan logika kalau mau lebih spesifik)
      return satkers[0].id;
    } else {
      throw new Error('Satker tidak ditemukan');
    }
  } catch (error) {
    console.error('Error mencari Satker:', error.message);
    throw error;
  }
}

// Set view engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Setup session
app.use(session({
  secret: 'sms',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Kalau HTTPS, set ke true
}));

// Middleware parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware check role
app.use((req, res, next) => {
  const user = req.session.user;
  const url = req.path;

  if (url.startsWith('/log')) {
    return next();
  }

  if (!user) {
    return res.redirect('/login');
  }

  if (url.startsWith('/superadmin') && !user.roles.includes('ROLE_SUPERADMIN')) {
    req.session.errorMessage = '403: Anda tidak memiliki akses ke halaman superadmin.';
    return res.redirect(req.get('Referer') || '/');
  }

  if (url.startsWith('/admin') && !user.roles.includes('ROLE_ADMIN')) {
    req.session.errorMessage = '403: Anda tidak memiliki akses ke halaman admin.';
    return res.redirect(req.get('Referer') || '/');
  }

  if (url.startsWith('/operator') && !user.roles.includes('ROLE_OPERATOR')) {
    req.session.errorMessage = '403: Anda tidak memiliki akses ke halaman operator.';
    return res.redirect(req.get('Referer') || '/');
  }

  next();
});

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

// Function login ke API
async function loginAndSave(email, password) {
  const response = await axios.post('http://localhost/login', {
    email: email,
    password: password
  });
  return response.data;
}

// Route untuk login user
app.post('/login-user', async (req, res) => {
  const { email, password } = req.body;

  try {
    const loginResponse = await loginAndSave(email, password);
    const accessToken = loginResponse.accessToken;

    // Habis login, ambil data user (ambil name)
    const userResponse = await axios.get(`http://localhost/users/search/findByEmail?email=${email}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const userData = userResponse.data; // Response yang isinya name, email, dst.

    // Ambil ID dari href
    let userId = null;
    const href = userData._links?.self?.href || userData._links?.additionalProp1?.href;
    if (href) {
      const idMatch = href.match(/\/users\/(\d+)/); // ambil angka setelah /users/
      if (idMatch) {
        userId = idMatch[1];
      }
    }

    // Simpan semuanya ke session
    req.session.user = {
      idUser: userId,
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

// Route untuk cek session user
app.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(401).json({ loggedIn: false, message: 'Not logged in' });
  }
});

// Route untuk logout
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.redirect('/login?logout=success');
  });
});

// Login
app.get('/login', (req, res) => {
  res.render('pages/login', { title: 'Login | SMS' });
});

const adminRoutes = require('./routes/admin');
const superadminRoutes = require('./routes/superadmin');
const operatorRoutes = require('./routes/operator');

app.use(adminRoutes);
app.use(superadminRoutes);
app.use(operatorRoutes);

// Profil
app.get('/user/detail', (req, res) => {
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

// Listen server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
