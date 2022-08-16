const express = require('express')
const router = express.Router()
const walletController = require('./wallets.controllers')

router.get('/:phone/check/balance', walletController.checkBalance)
router.post('/:phone/topup/balance', walletController.topupBalance)
router.get('/:phone/history')

module.exports = router