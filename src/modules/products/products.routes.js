const express = require("express");
const router = express.Router();
const productController = require("./products.controllers");
const productValidator = require("./products.validator");
const { reqAuth } = require('../../../middleware/req_auth')

router.get('/scrape', productController.getScrape);
router.get('/operators', productController.getOperatorList);
router.get('/:category/operator/:operator', reqAuth, productValidator.getProductByOperator, productController.getProductListByOperator);

module.exports = router;
