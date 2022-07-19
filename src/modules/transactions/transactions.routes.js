const express = require("express");
const router = express.Router();
const transactionController = require('../transactions/transactions.controllers')
const transactionValidator = require('../transactions/transactions.validator')
const { reqAuth } = require('../../../middleware/req_auth')

router.get('/product/:id/detail', transactionController.getTransactionDetail);
router.post('/product/:id/buy', reqAuth, transactionValidator.purchaseProduct, transactionController.purchaseProduct);
router.get('/product/:category/validate/:customerNo', reqAuth, transactionValidator.validateID, transactionController.validateID);

module.exports = router;
