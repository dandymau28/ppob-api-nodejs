const transactionService = require('./transactions.services')
const response = require('../../../response')
const http = require('../../../response/http_code')
const { validationResult } = require('express-validator');
const { process: logger } = require('../../../helper/logger')
const validate = require('../../../helper/validator');
const moment = require('moment');

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
            logger.log('info', `purchase product detail retrieved`);

            if (!product) {
                return response.error(res, http.NOT_FOUND, null, 'Product not found');
            }

            logger.log('info', 'creating pre txn detail ...');
            let detail = transactionService.preTxnDetail(product);
            logger.log('info', 'txn detail created');

            logger.log('info', 'call topup digiflazz ...');
            let topup = await transactionService.digiTopup({ code: detail.product_code, txnNumber })
            let topupData = topup.data.data;
            logger.log('info', 'call topup digiflazz done');

            logger.log('info', `purchase product creating transaction ... `);
            let txn = await transactionService.createTransaction({ user: req.user, product, totalPrice: detail.total, txnNumber, paymentRef: topupData.ref_id, response: topupData, status: topupData.status });
            transactionService.processTransaction({ phone: txn.user.noHandphone, pay: (txn.totalPrice * -1), txnRef: txn.txnRef, transaction: 'purchase' })
            logger.log('info', `purchase product transaction created ... `);
            
            logger.log('info', `purchase product finished`);
            delete txn.user;
            return response.success(res, txn, 'Transaksi Sukses!');
        } catch(err) {
            let responseData = {}
            if (err?.response?.data) {
                responseData = err.response.data
            }
            logger.log('error', `purchase product failed | ${err.message} | ${JSON.stringify(responseData || {})}`);
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
            let { s, l } = req.query;
            let uri = `/api/v1/transactions/${phone}/history`
            let next
            let sNext
            let lNext
            let resData = {
                totalTransaction: 0,
                transactions: []
            }

            if (req?.user?.noHandphone !== phone) {
                return response.error(res, http.FORBIDDEN, null, 'Forbidden');
            }

            logger.log('info', 'start service txnHistory');
            let totalAmount = await transactionService.totalAmtTxnHistoryByPhoneNumber(phone);
            totalAmount = totalAmount.pop()

            let totalDoc = await transactionService.totalDocTxnHistoryByPhoneNumber(phone);
            if (typeof s === 'string' && typeof l === 'string') {
                s = parseInt(s)
                l = parseInt(l)
                sNext = s === 0 ? l : s * l;
                lNext = l;

                if (sNext <= totalDoc) {
                    next = `${process.env.APP_URL}${uri}?s=${sNext}&l=${lNext}`;
                }
            }

            let txnHistory = await transactionService.txnHistoryByPhoneNumber(phone, s, l);
            resData.totalTransaction = totalAmount.amount
            resData.transactions = txnHistory
            logger.log('info', 'service txnHistory success');

            if (!txnHistory.length) {
                return response.error(res, http.NOT_FOUND, null, 'Record not found');
            }

            logger.log('info', 'get transaction history finished');
            return response.success(res, resData, 'Record found', next);
        } catch(err) {
            logger.log('info', `get transaction history failed | ${err.message}`);
            return response.internalError(res, null, err.message);
        }
    },
    getTransactionHistoryDetail: async(req, res) => {
        logger.log('info', 'get transaction history detail started ...');
        try {
            let { phone, ref } = req.params
                
            // if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            //     return response.badRequest(res, null, 'Invalid id given');
            // }
            
            if (!ref) {
                return response.badRequest(res, null, 'Missing required parameter: ref');
            }

            logger.log('info', 'get transaction history data started');
            let historyDetail = await transactionService.txnHistoryDetail(ref);
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
    },
    hookHandle: async(req, res) => {
        logger.log('debug', 'handling hook ...')
        let deliveryID = req.headers['x-digiflazz-delivery'];
        let eventType = req.headers['x-digiflazz-event'];
        let txnType = req.headers['user-agent'] === 'Digiflazz-Hookshot' ? 'prepaid' : 'postpaid';
        let { data } = req.body;

        try {
            logger.log('debug', `deliveryID: ${deliveryID}, eventType: ${eventType}, txnType: ${txnType}`);

            logger.log('info', 'saving hook ...');
            await transactionService.saveHook({ txnRef: data.ref_id, txnID: data.trx_id, deliveryID, hookEvent: eventType, txnType, postData: data })
            logger.log('info', 'hook saved');

            let txnDoc = await transactionService.isRefExist(data.ref_id);
            let isTxnExist = txnDoc > 0;

            if (!isTxnExist) {
                return response.error(res, http.NOT_FOUND, null, 'transaction not found');
            }

            let txn = await transactionService.txnByTxnRef(data.ref_id);

            if (data.rc === "00") {
                logger.log('info', 'update transaction ...')

                txn.status = "success";
                await transactionService.updateTxnByTxnRef(txn)

                txn.txnAt = moment().format();
                await transactionService.saveTxnHistory(txn)
                logger.log('info', 'update transaction success')
            } else {
                logger.log('info', 'process refund ...')

                transactionService.processTransaction({ phone: txn.user.noHandphone, pay: txn.totalPrice, txnRef: txn.txnRef, transaction: 'refund' })

                logger.log('info', 'process refund success')                
            }

            return response.success(res, null, 'Success');
        } catch(err) {
            logger.log('error', `handling hook failed | ${err.message}`);
            return response.internalError(res, null, err.message);

        }
    }
}

module.exports = controller