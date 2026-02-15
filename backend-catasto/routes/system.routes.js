const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');

router.get('/ping', systemController.ping);

module.exports = router;
