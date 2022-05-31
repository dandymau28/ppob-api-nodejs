const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Clients = new Schema({
    username: String,
    apiKey: String,
    deletedAt: Date
}, {
    timestamps: true
})

module.exports = mongoose.model('clients', Clients);