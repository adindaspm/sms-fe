const express = require('express');
const router = express.Router();
const satkerController = require('../controllers/satkerController');
const { validateSatker } = require('../validators/satkerValidator');
const handleValidation = require('../middleware/handleValidation');

router.get('/', satkerController.index);
router.get('/add', satkerController.addForm);
router.post('/save', validateSatker, handleValidation('layout', satkerController.renderAddForm), satkerController.save);
router.get('/:id/update', satkerController.updateForm);
router.post('/:id/update', validateSatker, handleValidation('layout', satkerController.renderUpdateForm), satkerController.update);

module.exports = router;
