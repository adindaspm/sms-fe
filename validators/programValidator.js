const { body } = require('express-validator');

const validateProgram = [
  body('year').notEmpty().withMessage('Tahun program wajib diisi.'),
  body('code').notEmpty().withMessage('Kode program wajib diisi.'),
  body('name').notEmpty().withMessage('Nama program wajib diisi.')
];

module.exports = { validateProgram };
