const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WalletHistory = new Schema({
    phone: String,
    description: String,
    debited_balance: Number,
    credited_balance: Number,
    balance_before: Number,
    balance: Number,
    txnAt: Date,
    wallet_id: mongoose.Types.ObjectId,
    txnRef: String,
    status: String
}, {
    timestamps: true
})

module.exports = mongoose.model('WalletHistory', WalletHistory)