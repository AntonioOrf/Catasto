const express = require('express');
const router = express.Router();
const parentiController = require('../controllers/parenti.controller');

router.get('/:id', parentiController.getByFuocoId);

module.exports = router;
