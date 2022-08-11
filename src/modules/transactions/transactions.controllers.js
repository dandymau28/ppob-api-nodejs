const transactionService = require('./transactions.services')
const response = require('../../../response')
const http = require('../../../response/http_code')
const { validationResult } = require('express-validator');
const { process: logger } = require('../../../helper/logger')
const validate = require('../../../helper/validator');

const controller = {
    getTransactionDetail: async(req, res) => {
        logger.log('info', 'getPurchaseDetail started ...');
        try {
            let { id } = req.params
            
            if (!validate.isValidObjectID(id)) {
                logger.log('error', `purchase product failed | Invalid id given`);
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
                
            if (!validate.isValidObjectID(productId)) {
                logger.log('error', `purchase product failed | Invalid id given`);
                return response.badRequest(res, null, 'Invalid id given');
            }

            logger.log('info', `purchase product detail retrieving ... `);
            let product = await transactionService.productDetail(productId);
            logger.log('info', `purchase product detail retrieved ... `);

            if (!product) {
                return response.error(res, http.NOT_FOUND, null, 'Product not found');
            }

            logger.log('info', 'creating pre txn detail ...');
            let detail = transactionService.preTxnDetail(product);
            logger.log('info', 'txn detail created');

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
    },
    getTransactionHistory: async(req, res) => {
        logger.log('info', 'get transaction history started ...');
        try {
            let { phone } = req.params;

            if (req?.user?.noHandphone !== phone) {
                return response.error(res, http.FORBIDDEN, null, 'Forbidden');
            }

            logger.log('info', 'start service txnHistory');
            let txnHistory = await transactionService.txnHistoryByPhoneNumber(phone);
            logger.log('info', 'service txnHistory success');

            if (!txnHistory.length) {
                return response.error(res, http.NOT_FOUND, null, 'Record not found');
            }

            logger.log('info', 'get transaction history finished');
            return response.success(res, txnHistory, 'Record found');
        } catch(err) {
            logger.log('info', `get transaction history failed | ${err.message}`);
            return response.internalError(res, null, err.message);
        }
    },
    getTransactionHistoryDetail: async(req, res) => {
        logger.log('info', 'get transaction history detail started ...');
        try {
            let { phone, id } = req.params
                
            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                return response.badRequest(res, null, 'Invalid id given');
            }
            
            logger.log('info', 'get transaction history data started');
            let historyDetail = await transactionService.txnHistoryDetail(id);
            logger.log('info', 'get transaction history data retrieved');

            if (!historyDetail) {
                return response.error(res, http.NOT_FOUND, null, 'Record not found');
            }

            if (phone !== historyDetail?.user?.noHandphone) {
                return response.error(res, http.FORBIDDEN, null, 'Forbidden');
            }

            logger.log('info', 'get transaction history detail finished');
            return response.success(res, historyDetail, 'Record found');
        } catch(err) {
            logger.log('info', `get transaction history detail failed | ${err.message}`);
            return response.internalError(res, null, err.message);
        }
    }
}

module.exports = controller