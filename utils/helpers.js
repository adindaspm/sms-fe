const axios = require('axios');

function parseIdFromLink(href) {
  if (!href) return null;
  const match = href.match(/\/(\d+)(\?.*)?$/);
  return match ? match[1] : null;
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
      return satkers[0].id;
    } else {
      throw new Error('Satker tidak ditemukan');
    }
  } catch (error) {
    console.error('Error mencari Satker:', error.message);
    throw error;
  }
}

module.exports = {
  parseIdFromLink,
  checkRole,
  getSatkerIdByName
};
