const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Wallets = new Schema({
    user: Object,
    balance: Number,
}, {
    timestamps: true
})

module.exports = mongoose.model('Wallets', Wallets)