const express = require('express');
const router = express.Router();
const provinceController = require('../controllers/provinceController');
// const { validateProvince } = require('../validators/provinceValidator');
const handleValidation = require('../middleware/handleValidation');

router.get('/', provinceController.index);
// router.get('/add', provinceController.addForm);
// router.post('/save', validateProvince, handleValidation('layout', provinceController.save));
router.get('/:code/satkers', provinceController.satkersByProvince);

module.exports = router;
