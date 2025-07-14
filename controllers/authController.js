const { loginAndSave } = require("../services/authService");
const { getUserByEmail } = require("../services/userService");

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
};