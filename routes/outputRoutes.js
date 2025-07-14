const express = require('express');
const router = express.Router();
const outputController = require('../controllers/outputController');
const { validateOutput } = require('../validators/outputValidator');
const handleValidation = require('../middleware/handleValidation');

router.get('/', outputController.index);
router.get('/add', outputController.addForm);
router.post('/save', validateOutput, handleValidation('layout', outputController.save));

module.exports = router;
