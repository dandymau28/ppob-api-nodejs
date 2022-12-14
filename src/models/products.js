const mongoose = require('mongoose');
require('mongoose-long')(mongoose);
const Schema = mongoose.Schema;
const {Types: {Long}} = mongoose;

const Products = new Schema({
    code: String,
    name: String,
    price: Number,
    status: Boolean,
    description: String,
    supplier: String,
    sourceLink: String,
    category: String,
    group: String,
    operator: String,
    deletedAt: Date
}, {
    timestamps: true
})

module.exports = mongoose.model('products', Products);