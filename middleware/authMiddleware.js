function authMiddleware(req, res, next) {
  const user = req.session.user;
  const url = req.path;

  // Allow akses ke halaman login
  if (url.startsWith('/log')) return next();

  if (!user) return res.redirect('/login');

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
}

function checkRole(allowedRoles) {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user || !user.roles || !allowedRoles.some(role => user.roles.includes(role))) {
      return res.status(403).send('Akses ditolak: tidak memiliki izin.');
    }
    next();
  };
}

module.exports = { authMiddleware, checkRole };
