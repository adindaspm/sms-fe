const { body } = require('express-validator');

const validateRole = [
  body('name').notEmpty().withMessage('Nama role wajib diisi.')
];

module.exports = { validateRole };
