function isAuthenticated(req, res, next) {
  if (req.session.user && req.session.user.accessToken) {
    // User ada dan punya accessToken
    next();
  } else {
    // Belum login, redirect ke login page
    res.redirect('/login'); // atau tampilkan error JSON kalau mau
  }
}

module.exports = { isAuthenticated };
