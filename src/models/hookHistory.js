const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hookHistory = new Schema({
    txnRef: String,
    txnID: String,
    deliveryID: String,
    hookEvent: String,
    txnType: String,
    data: Object
}, {
    timestamps: true
})

module.exports = mongoose.model('hookHistory', hookHistory);