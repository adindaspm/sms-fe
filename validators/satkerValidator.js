const { body } = require('express-validator');

const validateSatker = [
  body('name').notEmpty().withMessage('Nama satker wajib diisi.'),
  body('code').notEmpty().withMessage('Kode satker wajib diisi.'),
  body('email').notEmpty().withMessage('Email wajib diisi.').isEmail().withMessage('Format email tidak valid.'),
  body('number')
    .optional({ checkFalsy: true }), // boleh kosong
  body('address')
    .optional({ checkFalsy: true })
];

module.exports = { validateSatker };
