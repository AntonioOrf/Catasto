const express = require("express");
const router = express.Router();
const mestieriController = require("../controllers/mestieri.controller");

router.get("/", mestieriController.getMestieri);

module.exports = router;
