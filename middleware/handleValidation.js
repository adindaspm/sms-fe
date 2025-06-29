const { validationResult } = require('express-validator');

const handleValidation = (viewName, getAdditionalData = async (req) => ({})) => {
  return async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let additionalData = {};
      try {
        additionalData = await getAdditionalData(req); // <-- kirim req agar bisa ambil token
      } catch (e) {
        console.error('Gagal ambil additionalData:', e);
      }
      
      return res.render(viewName, {
        errors: errors.array(),
        old: req.body,
        ...additionalData,
      });
    }
    next();
  };
};

module.exports = handleValidation;
