const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const { validateProgram } = require('../validators/programValidator');
const handleValidation = require('../middleware/handleValidation');

router.get('/', programController.index);
router.get('/add', programController.addForm);
router.post('/save', validateProgram, handleValidation('layout', programController.renderAddForm), programController.save);
router.get('/:id/outputs', programController.outputsByProgram);

module.exports = router;
