const productService = require('./products.services');
const response = require('../../../response')
const http = require('../../../response/http_code');
const { process: logger } = require('../../../helper/logger')
const { validationResult } = require('express-validator');
const moment = require('moment');
const Operators = require('../products/operators.json')

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
    getProductListByOperator: async(req, res) => {
        logger.log('info', `${moment().format()} | Start getting product list by operator ...`);
        try {
            const errors = validationResult(req);
    
            if (!errors.isEmpty()) {
                return response.error(res, http.BAD_REQUEST, errors.array(), 'Invalid request');
            }

            let { category, operator } = req.params;

            let products = await productService.findByCategoryAndOperator(category, operator);

            if (!products || products.length === 0) {
                logger.log('error', `${moment().format()} | product list not found ${category}\/${operator} | ${JSON.stringify(products)}`);
                return response.error(res, http.NOT_FOUND, null, 'Product not found');
            }

            let newProducts = products.map((item) => {
                item.group = item.group.length > 3 ? Array.from(item.group)[0] + 'jt' : item.group + 'rb';
                return item;
            });

            logger.log('info', `${moment().format()} | getting product list by operator done `);
            return response.success(res, newProducts, 'success');
        } catch(err) {
            logger.log('error', `${moment().format()} | getting product list by operator failed `);
            response.internalError(res, err, err.message);
        }
    },
    getOperatorList: async(req, res) => {
        logger.log('info', `${moment().format()} | Start getting operator list ...`);
        try {
            let operators = Operators;

            if (!operators || operators.length === 0) {
                logger.log('error', `${moment().format()} | operators list not found | ${JSON.stringify(operators)}`);
                return response.error(res, http.NOT_FOUND, null, 'Operators not found');
            }

            logger.log('info', `${moment().format()} | getting operator list done `);
            return response.success(res, operators, 'success');
        } catch(err) {
            logger.log('error', `${moment().format()} | getting operator list failed `);
            response.internalError(res, err, err.message);
        }
    },    
}

module.exports = controller