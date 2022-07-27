const transactionService = require('./transactions.services')
const response = require('../../../response')
const http = require('../../../response/http_code')
const { validationResult } = require('express-validator');
const { process: logger } = require('../../../helper/logger')

const controller = {
    getTransactionDetail: async(req, res) => {
        logger.log('info', 'getPurchaseDetail started ...');
        try {
            let { id } = req.params
            
            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                return response.badRequest(res, null, 'Invalid id given');
            }

            logger.log('info', 'get product detail started ...');
            let product = await transactionService.productDetail(id);
            logger.log('info', 'get product detail finished ...');

            if (!product) {
                return response.error(res, http.NOT_FOUND, null, 'Product not found');
            }

            let detail = transactionService.preTxnDetail(product);

            return response.success(res, detail, 'success');
        } catch(err) {
            logger.log('error', `get product detail failed | ${err.message}`);
            return response.internalError(res, null, err.message);
        }
    },
    purchaseProduct: async(req, res) => {
        logger.log('info', `purchase product started ... `);
        try {
            const errors = validationResult(req);
    
            if (!errors.isEmpty()) {
                return response.error(res, http.BAD_REQUEST, errors.array(), 'Invalid request');
            }

            let { id: productId } = req.params;
            let { txn_number: txnNumber } = req.body;

            logger.log('info', `purchase product detail retrieving ... `);
            let product = await transactionService.productDetail(productId);
            let detail = transactionService.preTxnDetail(product);
            logger.log('info', `purchase product detail retrieved ... `);

            logger.log('info', `purchase product creating transaction ... `);
            let txn = await transactionService.createTransaction({ user: req.user, product, totalPrice: detail.total, txnNumber});
            txn.totalPrice = detail.total;
            delete txn.user;
            logger.log('info', `purchase product transaction created ... `);

            logger.log('info', `purchase product finished ... `);
            return response.success(res, txn, 'Transaksi Sukses!');
        } catch(err) {
            logger.log('error', `purchase product failed | ${err.message}`);
            return response.internalError(res, null, err.message);
        }
    },
    validateID: async(req, res) => {
        logger.log('info', 'validateID started ...');
        try {
            const errors = validationResult(req);
    
            if (!errors.isEmpty()) {
                return response.error(res, http.BAD_REQUEST, errors.array(), 'Invalid request');
            }

            let { category, customerNo } = req.params;
            let validate;
            
            logger.log('info', 'validateID calling service started ...');
            switch(category) {
                case 'listrik':
                    validate = await transactionService.PLNValidation(customerNo);
                    break;
                default:
                    throw new Error('Service not available');
            }
            logger.log('info', 'validateID calling service done ...');

            if (!validate) {
                throw new Error('No service to run');
            }

            //* extract data from axios
            let axiosData = validate.data;

            //* extract data return
            let { data } = axiosData;

            logger.log('info', 'validateID finished');
            if (!data.meter_no) {
                return response.badRequest(res, null, 'Customer ID invalid');
            }

            return response.success(res, data, 'success');
        } catch(err) {
            logger.log('error', `validateID failed | ${err.message}`);
            return response.internalError(res, null, err.message);
        }
    }
}

module.exports = controller