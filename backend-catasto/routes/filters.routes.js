const express = require("express");
const router = express.Router();
const filtersController = require("../controllers/filters.controller");

router.get("/", filtersController.getFilters);

module.exports = router;
