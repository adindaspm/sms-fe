const { body } = require('express-validator');

const validateDeputi = [
  body('code').notEmpty().withMessage('Kode deputi wajib diisi.'),
  body('name').notEmpty().withMessage('Nama deputi wajib diisi.')
];

module.exports = { validateDeputi };
