const Wallets = require('../../models/wallets')
const WalletHistory = require('../../models/walletHistory')
const processQueue = require('../../../queue/process')

const service = {
    getBalanceByPhone: async(phone) => {
        return await Wallets.findOne({ user: {phone}}).select({ user:1, balance:1, _id: 0})
    },
    processTransaction: (item) => {
        processQueue(item)
    },
    getHistoryByPhone: async(phone) => {
        return await WalletHistory.find({ phone }).select({ _id: 0}).sort({ txnAt: -1 })
    }
}

module.exports = service