const response = require('../../../response')
const http = require('../../../response/http_code')
const walletService = require('./wallets.services')
const { validationResult } = require('express-validator');

const controllers = {
    checkBalance: async(req, res) => {
        try {
            const errors = validationResult(req);
    
            if (!errors.isEmpty()) {
                return response.error(res, http.BAD_REQUEST, errors.array(), 'Invalid request');
            }

            let { phone } = req.params

            if (!phone) {
                return response.badRequest(res, 'Phone number required', 'invalid request')
            }

            let wallet = await walletService.getBalanceByPhone(phone)

            if (!wallet) {
                return response.error(res, http.NOT_FOUND, 'no wallet found', 'not found')
            }

            return response.success(res, wallet, 'wallet found');
        } catch (err) {
            return response.error(res, http.INTERNAL_SERVER_ERROR, err, 'InternalError')
        }
    },
    topupBalance: async(req, res) => {
        try {
            const errors = validationResult(req);
    
            if (!errors.isEmpty()) {
                return response.error(res, http.BAD_REQUEST, errors.array(), 'Invalid request');
            }

            let { phone } = req.params
            let { amount } = req.body

            walletService.processTransaction({ phone: phone, pay: amount, transaction: 'topup'})

            return response.success(res, null, 'Transaction processed')
        } catch (err) {
            console.error(err)
            return response.error(res, http.INTERNAL_SERVER_ERROR, err,'InternalError')
        }
    },
    getWalletHistory: async(req, res) => {
        try {
            const errors = validationResult(req);
    
            if (!errors.isEmpty()) {
                return response.error(res, http.BAD_REQUEST, errors.array(), 'Invalid request');
            }

            let { phone } = req.params

            let histories = await walletService.getHistoryByPhone(phone)

            if (!histories) {
                return response.error(res, http.NOT_FOUND, 'no wallet found', 'not found')
            }

            return response.success(res, histories, 'history found')
        } catch (err) {
            return response.error(res, http.INTERNAL_SERVER_ERROR,  err, 'InternalError')
        }
    }
}

module.exports = controllers