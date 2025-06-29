const { body } = require('express-validator');

const validateUser = [
  body('first_name').notEmpty().withMessage('Nama depan wajib diisi.'),
  body('last_name').notEmpty().withMessage('Nama belakang wajib diisi.'),
  body('nip').notEmpty().withMessage('NIP wajib diisi.').isNumeric().withMessage('NIP harus berupa angka.'),
  body('email').notEmpty().withMessage('Email wajib diisi.').isEmail().withMessage('Format email tidak valid.'),
  body('satker').notEmpty().withMessage('Satuan kerja wajib dipilih.')
];

module.exports = { validateUser };
