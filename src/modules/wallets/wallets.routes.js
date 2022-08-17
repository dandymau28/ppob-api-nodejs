const express = require('express')
const router = express.Router()
const walletController = require('./wallets.controllers')
const walletValidator = require('./wallets.validators')

router.get('/:phone/check/balance', walletValidator.checkBalance, walletController.checkBalance)
router.post('/:phone/topup/balance', walletValidator.topupBalance, walletController.topupBalance)
router.get('/:phone/history', walletValidator.history, walletController.getWalletHistory)

module.exports = router