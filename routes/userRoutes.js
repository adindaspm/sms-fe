const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser } = require('../validators/userValidator');
const handleValidation = require('../middleware/handleValidation');

router.get('/', userController.index);
router.get('/add', userController.addForm);
router.post('/save', validateUser, handleValidation('layout', userController.renderAddForm), userController.save);
router.get('/detail/:id', userController.detail);
router.post('/:id/activate', userController.activate);
router.post('/:id/deactivate', userController.deactivate);
router.get('/:id/roles', userController.roleForm);
router.post('/:id/roles/assign', userController.assignRole);
router.post('/:id/roles/remove', userController.removeRole);
router.get('/:id/update', userController.updateForm);
router.post('/:id/update', validateUser, handleValidation('layout', userController.renderUpdateForm), userController.update);

module.exports = router;
