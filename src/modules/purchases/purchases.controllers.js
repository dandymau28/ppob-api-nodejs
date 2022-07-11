const purchaseService = require('./purchases.services')
const response = require('../../../response')
const httpCode = require('../../../response/http_code')
const { process: logger } = require('../../../helper/logger')

const controller = {
    getPurchaseDetail: async(req, res) => {
        logger.log('info', 'getPurchaseDetail started ...');
        try {
            let { id } = req.params
            
            logger.log('info', 'get product detail started ...');
            let product = await purchaseService.productDetail(id);
            logger.log('info', 'get product detail finished ...');

            let { price } = product;
            let additional = price * 0.1;

            let data = {
                "product_name": `${product.operator} - ${product.group}000`,
                "product_code": product.code,
                "price" : price,
                "additional": additional,
                "total": price + additional
            }

            return response.success(res, data, 'success');
        } catch(err) {
            logger.log('error', `get product detail failed | ${err.message}`);
            return response.internalError(res, null, err.message);
        }


        /**
         * {
         *  "price": 299999,
         *  "promo": 1,
         *  "total": 299998
         * }
         */
    }
}

module.exports = controller