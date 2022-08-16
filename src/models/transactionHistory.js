const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionHistory = new Schema({
    user: Object,
    product: Object,
    paymentCode: String,
    status: String,
    txnRef: String,
    txnAt: Date,
    txnNumber: String,
    description: String
}, {
    timestamps: true
})

module.exports = mongoose.model('transactionHistory', TransactionHistory);