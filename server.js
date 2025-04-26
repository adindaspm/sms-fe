const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

// Set view engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route
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

app.get('/login', (req, res) => {
  res.render('pages/login', { title: 'Login | SMS' });
});

app.get('/operator/surveys', (req, res) => {
  res.render('layout', {
    title: 'Kegiatan | SMS',
    page: 'pages/operator/manajemenKegiatan'
  });
});

app.get('/superadmin/roles', (req, res) => {
  res.render('layout', {
    title: 'Role | SMS',
    page: 'pages/superadmin/manajemenRole'
  });
});

app.get('/superadmin/satkers', (req, res) => {
  res.render('layout', {
    title: 'Satuan Kerja | SMS',
    page: 'pages/superadmin/manajemenSatker'
  });
});

app.get('/superadmin/provinces', (req, res) => {
  res.render('layout', {
    title: 'Provinsi | SMS',
    page: 'pages/superadmin/manajemenProvinsi'
  });
});

app.get('/superadmin/programs', (req, res) => {
  res.render('layout', {
    title: 'Program | SMS',
    page: 'pages/superadmin/manajemenProgram'
  });
});

app.get('/superadmin/outputs', (req, res) => {
  res.render('layout', {
    title: 'Role | SMS',
    page: 'pages/superadmin/manajemenOutput'
  });
});

app.get('/admin/users', (req, res) => {
  res.render('layout', {
    title: 'Role | SMS',
    page: 'pages/admin/manajemenPengguna'
  });
});

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
