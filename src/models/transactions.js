const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Transactions = new Schema({
    user: Object,
    product: Object,
    paymentCode: String,
    status: String,
    totalPrice: Number,
    txnRef: String,
    txnNumber: String
}, {
    timestamps: true
})

module.exports = mongoose.model('transactions', Transactions);