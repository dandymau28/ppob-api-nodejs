const Products = require('../../models/products')
const Transactions = require('../../models/transactions')
const TxnHistory = require('../../models/transactionHistory')
const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')
const moment = require('moment')
const axios = require('axios').default

const service = {
    productDetail: async(id) => {
        return await Products.findById(id)
    },
    preTxnDetail: (product) => {
        let { price } = product;
        let additional = price * 0.1;

        let data = {
            "product_name": `${product.operator} - ${product.group}000`,
            "product_code": product.code,
            "price" : price,
            "additional": additional,
            "total": Math.round(price + additional)
        }

        return data
    },
    createTransaction: async({ user, product, totalPrice, txnNumber }) => {
        let session = null;
        
        let { noHandphone, username } = user;
        let { code, price, supplier, category, operator } = product;
        let paymentCode = generatePaymentCode();
        let paymentRef = generatePaymentRef();

        let txn = {
            user: { noHandphone, username },
            product: { code, price, supplier, category, operator },
            totalPrice,
            paymentCode,
            txnNumber,
            txnRef: paymentRef,
            status: 'pending'
        }

        return Transactions.createCollection()
        .then(() => mongoose.startSession())
        .then(_session => {
            session = _session;
            session.startTransaction();

            return Transactions.create([txn], {session: session});
        })
        .then(() => {
            delete txn.totalPrice;
            txn.txnAt = moment().format();

            return TxnHistory.create([txn], {session: session});
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