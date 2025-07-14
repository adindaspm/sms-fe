const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { validateRole } = require('../validators/roleValidator');
const handleValidation = require('../middleware/handleValidation');

router.get('/', roleController.index);
router.get('/add', roleController.addForm);
router.post('/save', validateRole, handleValidation('layout', roleController.renderAddForm), roleController.save);
router.get('/:code/users', roleController.usersByRole);

module.exports = router;
