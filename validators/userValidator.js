const { body } = require('express-validator');

const validateUser = [
 body('name')
    .custom((value, { req }) => {
      if (!value && (!req.body.first_name || !req.body.last_name)) {
        throw new Error('Nama wajib diisi.');
      }
      return true;
    }),

  // first_name: hanya wajib jika full_name kosong
  body('first_name')
    .if((value, { req }) => !req.body.name)
    .notEmpty().withMessage('Nama depan wajib diisi.'),

  // last_name: hanya wajib jika full_name kosong
  body('last_name')
    .if((value, { req }) => !req.body.name)
    .notEmpty().withMessage('Nama belakang wajib diisi.'),

  body('nip').notEmpty().withMessage('NIP wajib diisi.').isNumeric().withMessage('NIP harus berupa angka.'),
  body('email').notEmpty().withMessage('Email wajib diisi.').isEmail().withMessage('Format email tidak valid.'),
  body('satker').notEmpty().withMessage('Satuan kerja wajib dipilih.')
];

module.exports = { validateUser };
