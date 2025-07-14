const express = require('express');
const router = express.Router();
const deputiController = require('../controllers/deputiController');
const { validateDeputi } = require('../validators/deputiValidator');
const handleValidation = require('../middleware/handleValidation');

router.get('/', deputiController.index);
router.get('/add', deputiController.addForm);
router.post('/save', validateDeputi, handleValidation('layout', deputiController.renderAddForm), deputiController.save);

// router.get('/superadmin/deputis/add', async (req, res) => {

// });
// router.post('/superadmin/deputis', validateDeputi, handleValidation('layout', async (req) => {
//     const token = req.session.user?.accessToken;
//     return{
//       title: 'Tambah Deputi | SMS',
//       page: 'pages/superadmin/addDeputi',
//       activePage: 'deputis'
//     }
//   }), 
//   async (req, res) => {
  
// });

module.exports = router;
