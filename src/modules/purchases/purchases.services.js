const Products = require('../../models/products')

const service = {
    productDetail: async(id) => {
        return await Products.findById(id)
    }
}

module.exports = service