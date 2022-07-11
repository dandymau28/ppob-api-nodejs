const express = require("express");
const router = express.Router();
const purchaseController = require('../purchases/purchases.controllers')
const { reqAuth } = require('../../../middleware/req_auth')

router.get('/product/:id/detail', purchaseController.getPurchaseDetail);

module.exports = router;
