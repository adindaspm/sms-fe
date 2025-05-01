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

// Surveys
app.get('/operator/surveys', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    const namaUserLogin = req.session.user ? req.session.user.namaUser : null;

    if (!token || !namaUserLogin) {
      return res.redirect('/login.html');
    }

    const response = await axios.get('http://localhost/kegiatans', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    let kegiatanDtos = response.data._embedded.kegiatans;

    // Filter kegiatan yang namaUser-nya sama dengan user yang login
    kegiatanDtos = kegiatanDtos.filter(kegiatan => kegiatan.namaUser === namaUserLogin);

    const kegiatans = kegiatanDtos.map((kegiatan) => {
      const href = kegiatan._links?.self?.href || '';
      const idMatch = href.match(/\/kegiatans\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        name: kegiatan.name,
        namaUser: kegiatan.namaUser,
        namaSatker: kegiatan.namaSatker,
      };
    });
    // Kirim data ke halaman dengan 'kegiatanDtos'
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
app.get('/operator/surveys/add', async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const programsResponse = await axios.get('http://localhost/programs', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const outputsResponse = await axios.get('http://localhost/outputs', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    let programDtos = programsResponse.data._embedded.programs || [];
    let outputDtos = outputsResponse.data._embedded.outputs || [];

    programDtos = programDtos.map(program => {
      const href = program._links?.self?.href || '';
      const idMatch = href.match(/\/programs\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        href, 
        id,
        year: program.year,
        code: program.code,
        name: program.name
      };
    });
    outputDtos = outputDtos.map(output => {
      const href = output._links?.self?.href || '';
      const idMatch = href.match(/\/outputs\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        href, 
        id,
        ...output
      };
    });

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
      outputDtos,
      userName,
      userId,
      satkerName,
      satkerId
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/operator/surveys/detail/:id', async (req, res) => {
  const { id } = req.params;
  const token = req.session.user?.accessToken;

  try {
    const response = await axios.get(`http://localhost/kegiatans/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const kegiatan = response.data; // data kegiatan per ID

    res.render('layout', {
      title: 'Detail Kegiatan | SMS',
      page: 'pages/operator/detailKegiatan',
      activePage: 'surveys',
      id,
      kegiatan // kirim data kegiatan ke halaman
    });
  } catch (error) {
    console.error('Gagal ambil detail kegiatan:', error.message);
    res.redirect('/'); // fallback kalo error
  }
});
app.post('/operator/surveys', async (req, res) => {
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

    // Ambil detail lengkap user, satker, dan program
    const [userRes, satkerRes, provinceRes, programRes, outputRes] = await Promise.all([
      axios.get(`http://localhost/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`http://localhost/satkers/${satkerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`http://localhost/satkers/${satkerId}/province`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`http://localhost/programs/${program}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`http://localhost/outputs/${output}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
    ]);

    let userData = userRes.data;
    let satkerData = satkerRes.data;
    const provinceData = provinceRes.data;
    let programData = programRes.data;
    let outputData = outputRes.data;

    satkerData = {
      id: Number(satkerId),
      ...satkerData,
      province: provinceData
    };
    userData = {
      id: Number(userId),
      ...userData,
      satker: satkerData,
      namaSatker: satkerData.name
    };
    programData = {
      id: Number(program),
      ...programData
    };
    outputData = {
      id: Number(output),
      year: null, //outputData.year
      code: null, //outputData.code,
      name: null, // outputData.name,
      program: null, // {
      //   id: programData.id,
      //   name: programData.name,
      //   code: programData.code,
      //   year: programData.year
      // }
    }

    await axios.post('http://localhost/api/kegiatans', {
      id: null,
      name,
      code,
      budget: null,
      user: userData,
      satker: satkerData,
      program: programData,
      output: outputData,
      startDate,
      endDate,
      createdOn: now,
      updatedOn: null,
      namaUser: userData.name,
      namaSatker: satkerData.name
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    res.redirect('/operator/surveys');
  } catch (error) {
    console.error('Error saat tambah kegiatan:', error.response?.data || error.message);

    // Kirim error lewat query string (bisa juga pake express-flash kalau mau)
    // res.redirect('/operator/surveys/add?error=Gagal%20menyimpan%20kegiatan.');
    res.status(500).send('Internal Server Error');

  }
});
app.get('/operator/surveys/update/:id', async (req, res) => {
  const { id } = req.params;
  const token = req.session.user?.accessToken;

  try {
    const response = await axios.get(`http://localhost/kegiatans/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const kegiatan = response.data; // data kegiatan per ID

    res.render('layout', {
      title: 'Update Kegiatan | SMS',
      page: 'pages/operator/updateKegiatan',
      activePage: 'surveys',
      id,
      kegiatan // kirim data kegiatan ke halaman
    });
  } catch (error) {
    console.error('Gagal ambil detail kegiatan:', error.message);
    res.redirect('/dashboard'); // fallback kalo error
  }
});

// Profil
app.get('/user/detail', (req, res) => {
  res.render('layout', {
    title: 'Profil | SMS',
    page: 'pages/detailProfil'
  });
});

// Roles
app.get('/superadmin/roles', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login.html');
    }

    const response = await axios.get('http://localhost/roles', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let roleDtos = response.data._embedded.roles || [];

    // Ambil ID dari href
    roleDtos = roleDtos.map(role => {
      const href = role._links?.self?.href || '';
      const idMatch = href.match(/\/roles\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        name: role.name
      };
    });

    res.render('layout', {
      title: 'Role | SMS',
      page: 'pages/superadmin/manajemenRole',
      activePage: 'roles',
      roleDtos
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/superadmin/roles/add', (req, res) => {
  res.render('layout', {
    title: 'Role | SMS',
    page: 'pages/superadmin/addRole',
    activePage: 'roles'
  });
});
app.post('/superadmin/roles', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { role } = req.body;

    const requestBody = { name: role }; // di API field-nya "name"

    await axios.post('http://localhost/roles', requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Berhasil -> simpan pesan sukses
    req.session.successMessage = 'Role berhasil ditambahkan.';
    res.redirect('/superadmin/roles');
  } catch (error) {
    console.error('Gagal menyimpan role:', error.response ? error.response.data : error.message);

    // Gagal -> simpan pesan error
    req.session.errorMessage = 'Gagal menambahkan role.';
    res.redirect('back'); // Balik ke form role
  }
});
app.get('/superadmin/roles/:code/users', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { code } = req.params;

    const response = await axios.get(`http://localhost/roles/${code}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let userDtos = response.data._embedded.users || [];

    userDtos = userDtos.map(user => {
      const href = user._links?.self?.href || '';
      const idMatch = href.match(/\/users\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        name: user.name,
        email: user.email,
        satker: user.namaSatker
      };
    });
    
    res.render('layout', {
      title: 'Klasifikasi Role Pengguna| SMS',
      page: 'pages/superadmin/usersByRole', 
      activePage: 'roles',
      userDtos
    });
  } catch (error) {
    console.error('Error fetching satkers:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Satkers
app.get('/superadmin/satkers', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const response = await axios.get('http://localhost/satkers', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let satkerDtos = response.data._embedded.satkers || [];

    satkerDtos = satkerDtos.map(satker => {
      const href = satker._links?.self?.href || '';
      const idMatch = href.match(/\/satkers\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        code: satker.code,
        name: satker.name,
        address: satker.address
      };
    });

    res.render('layout', {
      title: 'Satuan Kerja | SMS',
      page: 'pages/superadmin/manajemenSatker',
      activePage: 'satkers',
      satkerDtos
    });
  } catch (error) {
    console.error('Error fetching satkers:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/superadmin/satkers/add', (req, res) => {
  res.render('layout', {
    title: 'Satuan Kerja | SMS',
    page: 'pages/superadmin/addSatker',
    activePage: 'satkers'
  });
});
app.get('/superadmin/satkers/:id/update', async (req, res) => {
  const { id } = req.params;
  const token = req.session.user?.accessToken;

  try {
    const response = await axios.get(`http://localhost/satkers/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    let satker = response.data; // data kegiatan per ID
    satker = {
      id,
      ...satker
    }

    res.render('layout', {
      title: 'Update Kegiatan | SMS',
      page: 'pages/superadmin/updateSatker',
      activePage: 'satkers',
      satker
    });
  } catch (error) {
    console.error('Gagal ambil detail satker:', error.message);
    res.send(500).status("Internal Server Error");
  }
});
app.get('/superadmin/satkers/update', async (req, res) => {
  const { id, createdOn,isProvince, name, code, address, number, email } = req.body;
  const token = req.session.user?.accessToken;

  const now = new Date().toISOString();
  
  try {
    const response = await axios.patch(`http://localhost/satkers/${id}`, {
      name: name,
      code: code,
      address: address,
      number: number,
      email: email,
      createdOn: createdOn,
      updatedOn: now,
      isProvince: isProvince
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    let satker = response.data; // data kegiatan per ID
    satker = {
      id,
      ...satker
    }

    res.render('layout', {
      title: 'Update Kegiatan | SMS',
      page: 'pages/superadmin/updateSatker',
      activePage: 'satkers',
      satker
    });
  } catch (error) {
    console.error('Gagal ambil detail satker:', error.message);
    res.send(500).status("Internal Server Error");
  }
});

// Provinces
app.get('/superadmin/provinces', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const response = await axios.get('http://localhost/provinces', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let provinceDtos = response.data._embedded.provinces || [];

    provinceDtos = provinceDtos.map(province => {
      const href = province._links?.self?.href || '';
      const idMatch = href.match(/\/provinces\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        code: province.code,
        name: province.name
      };
    });

    res.render('layout', {
      title: 'Provinsi | SMS',
      page: 'pages/superadmin/manajemenProvinsi',
      activePage: 'provinces',
      provinceDtos
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/superadmin/provinces/:code/satkers', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { code } = req.params;

    // Kirim request ke API /provinces/{id}/listSatkers
    const response = await axios.get(`http://localhost/provinces/${code}/listSatkers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let satkerDtos = response.data._embedded.satkers || [];

    satkerDtos = satkerDtos.map(satker => {
      const href = satker._links?.self?.href || '';
      const idMatch = href.match(/\/satkers\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        code: satker.code,
        name: satker.name,
        email: satker.email
      };
    });
    
    res.render('layout', {
      title: 'Satker di Provinsi | SMS',
      page: 'pages/superadmin/satkersByProvince', // ganti kalau mau halaman lain
      activePage: 'provinces',
      satkerDtos
    });
  } catch (error) {
    console.error('Error fetching satkers:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Programs
app.get('/superadmin/programs', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login.html');
    }

    const response = await axios.get('http://localhost/programs', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let programDtos = response.data._embedded.programs || [];

    programDtos = programDtos.map(program => {
      const href = program._links?.self?.href || '';
      const idMatch = href.match(/\/programs\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        year: program.year,
        code: program.code,
        name: program.name
      };
    });

    res.render('layout', {
      title: 'Program | SMS',
      page: 'pages/superadmin/manajemenProgram',
      activePage: 'programs',
      programDtos
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/superadmin/programs/add', (req, res) => {
  res.render('layout', {
    title: 'Program | SMS',
    page: 'pages/superadmin/addProgram',
    activePage: 'programs'
  });
});
app.post('/superadmin/programs', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    // Ambil data dari form
    const { name, code, year } = req.body;

    // Siapkan request body
    const requestBody = {
      name,
      code,
      year
    };

    // Kirim ke API
    await axios.post('http://localhost/programs', requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Redirect ke halaman daftar program setelah sukses
    req.session.successMessage = 'Program berhasil ditambahkan.';
    res.redirect('/superadmin/programs');
  } catch (error) {
    console.error('Gagal menyimpan program:', error.response ? error.response.data : error.message);
    
    req.session.errorMessage = 'Gagal menambahkan program.';
    res.redirect('back'); // balik ke halaman form
  }
});

// Outputs
app.get('/superadmin/outputs', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const response = await axios.get('http://localhost/outputs', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let outputDtos = response.data._embedded.outputs || [];

    outputDtos = outputDtos.map(output => {
      const href = output._links?.self?.href || '';
      const idMatch = href.match(/\/outputs\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        year: output.year,
        code: output.code,
        name: output.name
      };
    });

    res.render('layout', {
      title: 'Output | SMS',
      page: 'pages/superadmin/manajemenOutput',
      activePage: 'outputs',
      outputDtos
    });
  } catch (error) {
    console.error('Error fetching outputs:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/superadmin/outputs/add', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }
    
    const response = await axios.get('http://localhost/programs', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    let listPrograms = response.data._embedded.programs || [];

    listPrograms = listPrograms.map(program => {
      const href = program._links?.self?.href || '';
      const idMatch = href.match(/\/programs\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        href, 
        id,
        ...program
      };
    });

    res.render('layout', {
      title: 'Tambah Output | SMS',
      page: 'pages/superadmin/addOutput',
      activePage: 'outputs',
      listPrograms: listPrograms
    });
  } catch (error) {
    console.error('Error ambil Programs:', error);
    res.redirect(req.get('Referer'));
  }
});
app.post('/superadmin/outputs', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    // Ambil data dari form
    const { name, code, year, program } = req.body;

    // Siapkan request body
    const requestBody = {
      name,
      code,
      year,
      program
    };

    // Kirim ke API
    await axios.post('http://localhost/outputs', requestBody, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Redirect ke halaman daftar program setelah sukses
    req.session.successMessage = 'Output berhasil ditambahkan.';
    res.redirect('/superadmin/outputs');
  } catch (error) {
    console.error('Gagal menyimpan output:', error.response ? error.response.data : error.message);
    
    // req.session.errorMessage = 'Gagal menambahkan output.';
    // res.redirect('back'); // balik ke halaman form
    
    res.status(500).send('Internal Server Error');
  }
});

// Users
app.get('/admin/users', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login.html');
    }

    const response = await axios.get('http://localhost/users', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let userDtos = response.data._embedded.users || [];

    userDtos = userDtos.map(user => {
      const href = user._links?.self?.href || '';
      const idMatch = href.match(/\/users\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        email: user.email,
        name: user.name,
        roleName: user.roleName
      };
    });

    res.render('layout', {
      title: 'Pengguna | SMS',
      page: 'pages/admin/manajemenPengguna',
      activePage: 'users',
      userDtos
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/admin/users/add', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }
    
    const response = await axios.get('http://localhost/satkers', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    let listSatkers = response.data._embedded.satkers || [];

    listSatkers = listSatkers.map(satker => {
      const href = satker._links?.self?.href || '';
      const idMatch = href.match(/\/satkers\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        ...satker
      };
    });

    res.render('layout', {
      title: 'Tambah Pengguna | SMS',
      page: 'pages/admin/addPengguna',
      activePage: 'users',
      listSatkers: listSatkers
    });
  } catch (error) {
    console.error('Error ambil Satkers:', error);
    res.redirect(req.get('Referer'));
  }
});
app.post('/admin/users/save', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const { first_name, last_name, nip, email, satker } = req.body;
    const parsedSatker = JSON.parse(decodeURIComponent(satker)); // <- parse kembali ke object

    // Gabung nama depan + nama belakang jadi fullName
    // const fullName = `${first_name} ${last_name}`;
    const payload = {
      firstName: first_name,
      lastName: last_name,
      nip: nip,
      email: email,
      password: nip, // Default password = NIP
      satker: parsedSatker
    };
    
    await axios.post('http://localhost/api/users', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    req.session.successMessage = 'Pengguna berhasil ditambahkan.';
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error simpan pengguna:', error?.response?.data || error.message);
    
    res.status(500).send('Internal Server Error');
    // req.session.errorMessage = 'Gagal menambahkan pengguna.';
    // res.redirect('/admin/users/add');
  }
});
app.get('/admin/users/detail/:id', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const userId = req.params.id;

    // Panggil API /users/{id}
    const response = await axios.get(`http://localhost/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const userData = response.data;

    // Ambil roles user
    const rolesResponse = await axios.get(`http://localhost/users/${userId}/roles`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    let userRoles = rolesResponse.data._embedded?.roles || [];

    // Map roles
    userRoles = userRoles.map(role => {
      return {
        name: role.name.replace('ROLE_', '') // Hilangin prefix ROLE_
      };
    });

    // Buat DTO untuk dikirim ke view
    const userDto = {
      id: userId,
      name: userData.name,
      email: userData.email,
      satker: userData.namaSatker,
      roles: userRoles
    };

    res.render('layout', {
      title: 'Detail Pengguna | SMS',
      page: 'pages/admin/detailPengguna',
      activePage: 'users',
      user: userDto
    });

  } catch (error) {
    console.error('Error mengambil detail user:', error.response ? error.response.data : error.message);
    req.session.errorMessage = 'Gagal mengambil data user.';
    res.redirect('/admin/users'); // Balik ke halaman list user kalau gagal
  }
});
app.get('/admin/users/:id/roles', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const userId = req.params.id;

    // Ambil data user
    const userResponse = await axios.get(`http://localhost/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let userDto = userResponse.data;

    userDto = {
      id: userId,
      ...userDto
    };

    // Ambil semua roles
    const allRolesResponse = await axios.get('http://localhost/roles', {
      params: {
        size: 10000 // ganti sesuai dengan jumlah maksimum data
      },
      headers: { Authorization: `Bearer ${token}` }
    });
    let roleDtos = allRolesResponse.data._embedded.roles || [];

    roleDtos = roleDtos.map(role => {
      const href = role._links?.self?.href || '';
      const idMatch = href.match(/\/roles\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        code: role.code,
        name: role.name
      };
    });

    // Ambil roles milik user ini
    const userRolesResponse = await axios.get(`http://localhost/users/${userId}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let userRoleDtos = userRolesResponse.data._embedded.roles || [];

    userRoleDtos = userRoleDtos.map(role => {
      const href = role._links?.self?.href || '';
      const idMatch = href.match(/\/roles\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      return {
        id,
        code: role.code,
        name: role.name
      };
    });

    res.render('layout', {
      title: 'Kelola Peran Pengguna | SMS',
      page: 'pages/admin/kelolaPeran',
      activePage: 'users',
      userDto,
      roleDtos,
      userRoleDtos
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/admin/users/:id/roles/assign', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const userId = req.params.id;
    const { roleId } = req.body;

    await axios.post(`http://localhost/api/users/${userId}/roles/${roleId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }
    );

    res.redirect(`/admin/users/${userId}/roles`);
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/admin/users/:id/roles/remove', async (req, res) => {
  try {
    const token = req.session.user ? req.session.user.accessToken : null;
    if (!token) {
      return res.redirect('/login');
    }

    const userId = req.params.id;
    const { roleId } = req.body;

    await axios.delete(`http://localhost/users/${userId}/roles/${roleId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    res.redirect(`/admin/users/${userId}/roles`);
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).send('Internal Server Error');
  }
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
