const { loginAndSave } = require("../services/authService");
const { getUserByEmail, getCurrentUser } = require("../services/userService");

exports.login = async (req, res) => {
  try {
    res.render('pages/login', {
        title: 'Login | SMS'
    });
  } catch (error) {
    req.session.errorMassage = 'Terdapat kesalahan server. Coba lagi nanti.'
  }
};

exports.logout = async (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.redirect('/login?logout=success');
  });
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginResponse = await loginAndSave(email, password);
    const accessToken = loginResponse.accessToken;
    const userData = await getCurrentUser(accessToken);

    // Simpan semuanya ke session
    req.session.user = {
      idUser: userData.id,
      email: loginResponse.email,
      accessToken: accessToken,
      roles: loginResponse.roles,
      namaUser: userData.name,       // <-- nama user dari /users
      satkerName: userData.satkerName,
      satkerId: userData.satkerId,
      direktoratId: userData.direktoratId,
      direktoratName: userData.direktoratName,
      deputiName: userData.deputiName
    };

    // Kalau sukses, langsung redirect ke /
    res.redirect('/');

  } catch (error) {
    if (error.response) {
      // Ada response dari server (contoh: 400, 401, dsb)
      req.session.errorMessage = 'Email dan password tidak valid!';
      console.error('Login failed:', error.response.data || error.message);
    } else if (error.request) {
      // Request dikirim tapi tidak ada respons (server mati atau timeout)
      console.error('Login failed: Tidak bisa menghubungi API. Hubungi developer.');
      req.session.errorMessage = 'Gagal menghubungi API! Hubungi developer.';
    } else {
      // Error lain (misalnya error saat konfigurasi axios)
      console.error('Login failed:', error.message);
    }

    res.redirect('/login?error=true');
  }
};