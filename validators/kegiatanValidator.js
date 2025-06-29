const { body } = require('express-validator');
const dayjs = require('dayjs');

const notPastDate = (fieldName, name) => {
  return body(fieldName)
    .notEmpty().withMessage(`${fieldName} wajib diisi.`)
    .custom((value) => {
      if (!dayjs(value, 'YYYY-MM-DD', true).isValid()) {
        throw new Error(`${name} harus dalam format tanggal valid (YYYY-MM-DD).`);
      }
      if (dayjs(value).isBefore(dayjs(), 'day')) {
        throw new Error(`${name} tidak boleh di masa lalu.`);
      }
      return true;
    });
};

const validateKegiatan = [
  body('name').notEmpty().withMessage('Nama kegiatan wajib diisi.'),
  body('program')
    .notEmpty().withMessage('Program wajib dipilih.'),
  body('output')
    .notEmpty().withMessage('Output wajib dipilih.'),
  body('code').notEmpty().withMessage('Kode kegiatan wajib diisi.'),
  notPastDate('startDate','Tanggal mulai'),
  notPastDate('endDate','Tanggal selesai'),
  body('endDate')
    .custom((endDate, { req }) => {
      const startDate = req.body.startDate;
      if (
        dayjs(startDate, 'YYYY-MM-DD', true).isValid() &&
        dayjs(endDate, 'YYYY-MM-DD', true).isValid()
      ) {
        if (dayjs(endDate).isBefore(dayjs(startDate))) {
          throw new Error('Tanggal selesai tidak boleh sebelum tanggal mulai.');
        }
      }
      return true;
    }),
  body('satkerId')
    .notEmpty().withMessage('Satuan kerja wajib dipilih.')
  // body('pj').notEmpty().withMessage('Penanggung jawab wajib diisi.')
];

module.exports = { validateKegiatan };
