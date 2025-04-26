const express = require('express');
const session = require('express-session');
const axios = require('axios');
const app = express();
const path = require('path');
const port = 3000;

// Middleware parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup session
app.use(session({
  secret: 'sms',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Kalau HTTPS, set ke true
}));

// Set view engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Apply middleware ke semua route untuk cek autentikasi login
app.use((req, res, next) => {
  const publicPaths = ['/login-user', '/login']; // bebas tambah
  // Kalau user sudah login, set variabel untuk di EJS
  res.locals.loggedInUser = req.session.user || null;
  
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

    // Simpan semuanya ke session
    req.session.user = {
      email: loginResponse.email,
      accessToken: accessToken,
      roles: loginResponse.roles,
      namaUser: userData.name,       // <-- nama user dari /users
      namaSatker: userData.namaSatker,
      idUser: userData.id // (kalau mau satker sekalian juga)
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

// Surveys
app.get('/operator/surveys', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    const namaUserLogin = req.session.user ? req.session.user.namaUser : null;

    if (!token || !namaUserLogin) {
      return res.redirect('/login.html');
    }

    const response = await axios.get('http://localhost/kegiatans', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    let kegiatanDtos = response.data._embedded.kegiatans;

    // Filter kegiatan yang namaUser-nya sama dengan user yang login
    kegiatanDtos = kegiatanDtos.filter(kegiatan => kegiatan.namaUser === namaUserLogin);

    // Kirim data ke halaman dengan 'kegiatanDtos'
    res.render('layout', {
      title: 'Kegiatan | SMS',
      page: 'pages/operator/manajemenKegiatan',
      kegiatanDtos: kegiatanDtos  // Kirim data kegiatan ke view
    });
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/operator/surveys/add', (req, res) => {
  res.render('layout', {
    title: 'Tambah Kegiatan | SMS',
    page: 'pages/operator/addKegiatan'
  });
});

// Profil
app.get('/user/detail', (req, res) => {
  res.render('layout', {
    title: 'Profil | SMS',
    page: 'pages/detailProfil'
  });
});

// Roles
app.get('/superadmin/roles', (req, res) => {
  res.render('layout', {
    title: 'Role | SMS',
    page: 'pages/superadmin/manajemenRole'
  });
});
app.get('/superadmin/roles/add', (req, res) => {
  res.render('layout', {
    title: 'Role | SMS',
    page: 'pages/superadmin/addRole'
  });
});

// Satkers
app.get('/superadmin/satkers', (req, res) => {
  res.render('layout', {
    title: 'Satuan Kerja | SMS',
    page: 'pages/superadmin/manajemenSatker'
  });
});
app.get('/superadmin/satkers/add', (req, res) => {
  res.render('layout', {
    title: 'Satuan Kerja | SMS',
    page: 'pages/superadmin/addSatker'
  });
});

// Provinces
app.get('/superadmin/provinces', (req, res) => {
  res.render('layout', {
    title: 'Provinsi | SMS',
    page: 'pages/superadmin/manajemenProvinsi'
  });
});

// Programs
app.get('/superadmin/programs', (req, res) => {
  res.render('layout', {
    title: 'Program | SMS',
    page: 'pages/superadmin/manajemenProgram'
  });
});
app.get('/superadmin/programs/add', (req, res) => {
  res.render('layout', {
    title: 'Program | SMS',
    page: 'pages/superadmin/addProgram'
  });
});

// Outputs
app.get('/superadmin/outputs', (req, res) => {
  res.render('layout', {
    title: 'Role | SMS',
    page: 'pages/superadmin/manajemenOutput'
  });
});

// Users
app.get('/admin/users', (req, res) => {
  res.render('layout', {
    title: 'Role | SMS',
    page: 'pages/admin/manajemenPengguna'
  });
});
app.get('/admin/users/add', (req, res) => {
  res.render('layout', {
    title: 'Role | SMS',
    page: 'pages/admin/addPengguna'
  });
});

// FAQ
app.get('/faq', (req, res) => {
  res.render('layout', {
    title: 'Role | SMS',
    page: 'pages/faq'
  });
});

// Listen server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
