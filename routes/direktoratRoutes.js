const express = require('express');
const router = express.Router();
const direktoratController = require('../controllers/direktoratController');
const { validateDirektorat } = require('../validators/direktoratValidator');
const handleValidation = require('../middleware/handleValidation');

router.get('/', direktoratController.index);
router.get('/add', direktoratController.addForm);
router.post('/save', validateDirektorat, handleValidation('layout', direktoratController.renderAddForm), direktoratController.save);

module.exports = router;
