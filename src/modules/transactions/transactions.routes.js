const express = require("express");
const router = express.Router();
const transactionController = require('../transactions/transactions.controllers')
const { reqAuth } = require('../../../middleware/req_auth')

router.get('/product/:id/detail', transactionController.getTransactionDetail);
router.post('/product/:id/buy', reqAuth, transactionController.purchaseProduct);

module.exports = router;
