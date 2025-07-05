const { body } = require('express-validator');

const validateDirektorat = [
  body('code').notEmpty().withMessage('Kode direktorat wajib diisi.'),
  body('name').notEmpty().withMessage('Nama direktorat wajib diisi.'),
  body('deputi').notEmpty().withMessage('Deputi wajib diisi.')
];

module.exports = { validateDirektorat };
