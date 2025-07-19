const express = require('express');
const router = express.Router();
const kegiatanController = require('../controllers/kegiatanController');
const { validateKegiatan } = require('../validators/kegiatanValidator');
const handleValidation = require('../middleware/handleValidation');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/', kegiatanController.index);
router.get('/add', kegiatanController.addForm);
router.post('/save', validateKegiatan, handleValidation('layout', kegiatanController.renderAddForm), kegiatanController.save);
router.get('/detail/:id', kegiatanController.detail);
router.get('/:id/update', kegiatanController.updateForm);
router.post('/:id/update', validateKegiatan, handleValidation('layout', kegiatanController.renderUpdateForm), kegiatanController.update);
router.post('/tahap/:idKegiatan/:idTahap/:idSubTahap', kegiatanController.updateTahap);
router.post('/tahap/:idKegiatan/:idTahap/:idSubTahap/rencana', kegiatanController.updateTanggalTahap);
router.get('/files/tahap/:idKegiatan/:idTahap', kegiatanController.downloadFile);
router.post('/upload/tahap/:idKegiatan/:idTahap', upload.single('file'), kegiatanController.uploadFile);

module.exports = router;
