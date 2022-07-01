const express = require("express");
const router = express.Router();
const productController = require("./products_controllers");

router.get('/scrape', productController.getScrape);

module.exports = router;
