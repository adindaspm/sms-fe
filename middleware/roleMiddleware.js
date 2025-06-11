function checkRole(allowedRoles) {
  return (req, res, next) => {
    const user = req.session.user;

    if (!user || !user.roles || !allowedRoles.some(role => user.roles.includes(role))) {
      return res.status(403).send('Akses ditolak: tidak memiliki izin.');
    }

    next();
  };
}

module.exports = { checkRole };
