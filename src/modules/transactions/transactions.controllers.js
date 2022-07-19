const transactionService = require('./transactions.services')
const response = require('../../../response')
const httpCode = require('../../../response/http_code')
const { process: logger } = require('../../../helper/logger')

const controller = {
    getTransactionDetail: async(req, res) => {
        logger.log('info', 'getPurchaseDetail started ...');
        try {
            let { id } = req.params
            
            logger.log('info', 'get product detail started ...');
            let product = await transactionService.productDetail(id);
            logger.log('info', 'get product detail finished ...');

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
    }
}

module.exports = controller