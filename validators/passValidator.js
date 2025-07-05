const { body } = require('express-validator');

const validatePass = [
  body('passbaru')
    .notEmpty().withMessage('Password wajib diisi.')
    .isLength({ min: 8 }).withMessage('Password minimal terdiri dari 8 karakter.')
    .matches(/[a-z]/).withMessage('Password harus mengandung huruf kecil.')
    .matches(/[A-Z]/).withMessage('Password harus mengandung huruf besar.')
    .matches(/[0-9]/).withMessage('Password harus mengandung angka.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password harus mengandung karakter spesial.'),
  body('confirmPass')
    .notEmpty().withMessage('Konfirmasi password wajib diisi.')
    .custom((value, { req }) => {
      if (value !== req.body.passbaru) {
        throw new Error('Konfirmasi password harus sama dengan password baru.');
      }
      return true;
    })

];

module.exports = { validatePass };
