const express = require('express');
const router = express.Router();
const catastoController = require('../controllers/catasto.controller');

router.get('/', catastoController.getAll);
router.get('/sidebar', catastoController.getSidebar);

module.exports = router;
