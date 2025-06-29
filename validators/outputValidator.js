const { body } = require('express-validator');

const validateOutput = [
  body('year').notEmpty().withMessage('Tahun output wajib diisi.'),
  body('code').notEmpty().withMessage('Kode output wajib diisi.'),
  body('name').notEmpty().withMessage('Nama output wajib diisi.'),
  body('program').notEmpty().withMessage('Program wajib diisi.')
];

module.exports = { validateOutput };
