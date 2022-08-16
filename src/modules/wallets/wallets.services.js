const Wallets = require('../../models/wallets')
const processQueue = require('../../../queue/process')

const service = {
    getBalanceByPhone: async(phone) => {
        return await Wallets.findOne({ phone}).select({ user:1, balance:1, _id: 0})
    },
    processTransaction: ({ phone: phone, pay: amount}) => {
        processQueue({ phone: phone, pay: amount})
    }
}

module.exports = service