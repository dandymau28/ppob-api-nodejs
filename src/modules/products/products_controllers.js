const productService = require('./products_services');
const response = require('../../../response')
const { process: logger } = require('../../../helper/logger')
const moment = require('moment')

const controller = {
    getScrape: async(req, res) => {
        logger.log('info', `${moment().format()} | Start scraping ... `);
        try {
            await Promise.all([productService.scrapeOtomax(), productService.scrapeStokpulsa()]);
            
            logger.log('info', `${moment().format()} | Scrape finished `);
            response.success(res, {}, 'success');
        } catch(err) {
            logger.log('error', `${moment().format()} | Scrape failed `);
            response.internalError(res, err, err.message);
        }
    },
    getProductBySupplier: async(req, res) => {
        logger.log('info', `${moment().format()}`);
        try {

        } catch(err) {

        }
    }
}

module.exports = controller