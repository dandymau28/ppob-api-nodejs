const Products = require('../../models/products')
const Transactions = require('../../models/transactions')
const TxnHistory = require('../../models/transactionHistory')
const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')
const moment = require('moment')
const axios = require('axios').default
const processQueue = require('../../../queue/process')
const { process: logger } = require('../../../helper/logger')
const md5 = require('md5')
const HookHistory = require('../../models/hookHistory')

const service = {
    productDetail: async(id) => {
        return await Products.findById(id)
    },
    preTxnDetail: (product) => {
        let { price } = product;
        let additional = price * 0.1;

        let data = {
            "product_name": `${product.operator} - ${product.group}`,
            "product_code": product.code,
            "price" : price,
            "additional": additional,
            "total": Math.round(price + additional)
        }

        return data
    },
    createTransaction: async({ user, product, totalPrice, txnNumber, response, paymentRef, status }) => {
        let session = null;
        
        let { noHandphone, username } = user;
        let { code, price, supplier, category, operator, description } = product;
        let paymentCode = generatePaymentCode();

        let txn = {
            user: { noHandphone, username },
            product: { code, price, supplier, category, operator, description },
            totalPrice,
            paymentCode,
            txnNumber,
            txnRef: paymentRef,
            txnAt: moment().format(),
            status,
            sourceResponse: response,
        }

        return Transactions.createCollection()
        .then(() => mongoose.startSession())
        .then(_session => {
            session = _session;
            session.startTransaction();

            return Transactions.create([txn], {session: session});
        })
        .then(() => {
            // delete txn.totalPrice;
            let txnHistory = { ...txn }
            delete txnHistory.totalPrice
            // txn.txnAt = moment().format();

            return TxnHistory.create([txnHistory], {session: session});
        })
        .then(() => session.commitTransaction())
        .then(() => session.endSession())
        .then(() => txn);
    },
    PLNValidation: async(customerNo) => {
        let url = 'https://api.digiflazz.com/v1/transaction';
        let body = {
            'commands': 'pln-subscribe',
            'customer_no': customerNo
        }

        return await axios.post(url, body);
    },
    txnHistoryByPhoneNumber: async({phoneNumber, skip = -1, limit = 0, start_date = "", end_date = "", status = "", category = ""}) => {
        let filter = {
            user: {
                noHandphone: phoneNumber
            }
        }

        if (start_date && end_date) {
            filter["txnAt"] = {
                $gte: start_date,
                $lt: end_date
            }
        }

        if (status) {
            filter["status"] = status
        }

        if (category) {
            filter["product.category"] = category
        }

        if (skip >= 0 && limit > 0) {
            return await Transactions.find(filter).select({ user:1, product: 1, status: 1, totalPrice: 1, txnRef: 1, txnNumber: 1, txnAt: 1 }).sort({txnAt: -1}).skip(skip).limit(limit)
        } else {
            return await Transactions.find(filter).select({ user:1, product: 1, status: 1, totalPrice: 1, txnRef: 1, txnNumber: 1, txnAt: 1 }).sort({txnAt: -1})
        }
    },
    totalDocTxnHistoryByPhoneNumber: async(phoneNumber) => {
        return await Transactions.countDocuments({ user: { noHandphone: phoneNumber } })
    },
    totalAmtTxnHistoryByPhoneNumber: async(phoneNumber) => {
        return await Transactions.aggregate([
            { $match: { user: { noHandphone: phoneNumber }}},
            { $group: { _id: null, amount: { $sum: "$totalPrice" } }}
        ])
    },
    txnHistoryDetail: async(txnRef) => {
        let txn = await Transactions.findOne({ txnRef: txnRef}).select({ user:1, product: 1, status: 1, totalPrice: 1, txnRef: 1, txnNumber: 1, txnAt: 1 }).lean();
        let historySeries = await TxnHistory.find({ txnRef }).sort({ txnAt: -1}).lean();

        txn = Object.assign(txn, { detail: historySeries });

        return txn;
    },
    processTransaction: ({ phone, pay, txnRef, transaction }) => {
        // processQueue({ phone: txn.user.noHandphone, pay: (txn.totalPrice * -1), txnRef: txn.txnRef, transaction: 'purchase' })
        processQueue({ phone, pay, txnRef, transaction })
    },
    digiTopup: async({ code, txnNumber }) => {
        let url = process.env.DIGI_URL + '/transaction';
        let username = process.env.DIGI_USERNAME;
        let apiKey = process.env.DIGI_API_KEY;
        let isDev = process.env.NODE_ENV;
        let txnRef = generatePaymentRef()
    
        let body = {
            username,
            buyer_sku_code: code,
            customer_no: txnNumber,
            ref_id: txnRef,
            sign: md5(username + apiKey + txnRef)
        }

        if (isDev) {
            body["testing"] = true
            body["buyer_sku_code"] = "xld10"
            body["customer_no"] = "087800001233"
        }
        
        return await axios.post(url, body)
    },
    saveHook: async({ txnRef, txnID, deliveryID, hookEvent, txnType, postData }) => {
        return await HookHistory.create({ txnRef, txnID, deliveryID, hookEvent, txnType, data: postData });
    },
    isRefExist: async(txnRef) => {
        return await Transactions.countDocuments({ txnRef });
    },
    txnByTxnRef: async(txnRef) => {
        return await Transactions.findOne({ txnRef });
    },
    updateTxnByTxnRef: async(txn) => {
        return await Transactions.findOneAndUpdate({ txnRef: txn.txnRef }, txn)
    },
    saveTxnHistory: async(txn) => {
        return await TxnHistory.create(txn)
    }
}

const generatePaymentRef = () => {
    let dateCode = moment().format('YYMMDD');
    let prefix = `R-PPOB-${dateCode}`;

    return `${prefix}-${uuidv4()}`;
}

const generatePaymentCode = () => {
    let dateCode = moment().format('YYMMDD');
    let prefix = `T-PPOB-${dateCode}`;

    return `${prefix}-${uuidv4()}`;
}

module.exports = service