const Queue = require('./index')
const Wallets = require('../src/models/wallets')
const WalletHistory = require('../src/models/walletHistory')
const TxnHistory = require('../src/models/transactionHistory');
const Transactions = require('../src/models/transactions')
const { v4: uuidv4 } = require('uuid')
const moment = require('moment')
const mongoose = require('mongoose')

var q = new Queue()
var onProcess = new Map()
var emptyBefore = true

const process = async() => {
    while (!q.isEmpty()) {
        let item = q.receive()
        if (onProcess.get(item.phone)) {
            q.send(item)
        } else {
            onProcess.set(item.phone, 1)

            try {
                var wallet = await Wallets.findOne({user: {phone: item.phone}}).select({ balance: 1})
                var newBalance = wallet.balance + item.pay
                if (newBalance < wallet.balance) {
                    throw new Error('insufficient balance')
                }
                var debited_balance = 0;
                var credited_balance = 0;

                if (item.pay >= 0) {
                    debited_balance = item.pay
                } else {
                    credited_balance = item.pay
                }

                let update = await Wallets.updateOne({ user: {phone: item.phone}}, {balance: newBalance})

                if (update.modifiedCount === 1) {

                    switch(item.transaction) {
                        case 'topup':
                            await WalletHistory.create({
                                phone: item.phone,
                                description: 'Topup Balance',
                                debited_balance,
                                credited_balance,
                                balance_before: wallet.balance,
                                balance: newBalance,
                                txnAt: moment().format(),
                                wallet_id: wallet._id,
                                txnRef: uuidv4(),
                                status: 'success'
                            })
                            break;
                        case 'purchase':
                            await Promise.all([updateHistory(item, debited_balance, credited_balance, wallet, newBalance), updateTransaction(item, 'success')])
                            break;
                    }
                }
            } catch (err) {
                switch(item.transaction) {
                    case 'topup':
                        await WalletHistory.create({
                            phone: item.phone,
                            description: 'Topup Balance',
                            debited_balance,
                            credited_balance,
                            balance_before: wallet.balance,
                            balance: newBalance,
                            txnAt: moment().format(),
                            wallet_id: wallet._id,
                            txnRef: uuidv4(),
                            status: 'failed'
                        })
                        break;
                    case 'purchase':
                        await Promise.all([updateTransaction(item, 'failed', err.message)])
                        break;
                }
            }

            onProcess.delete(item.phone)
        }
    }
}

const reportError = (item, err) => {
    console.log(err)
}

const updateHistory = async(item, debited_balance, credited_balance, wallet, newBalance, status) => {
    return await WalletHistory.create({
        phone: item.phone,
        description: 'Purchase Product',
        debited_balance,
        credited_balance,
        balance_before: wallet.balance,
        balance: newBalance,
        txnAt: moment().format(),
        wallet_id: wallet._id,
        txnRef: item?.txnRef,
        status
    })
}

const updateTransaction = async(item, status, errorMessage = '') => {
    let session = null
    let txn = await Transactions.findOne({ phone: item.phone, txnRef: item.txnRef }).lean()

    return Transactions.createCollection()
        .then(() => mongoose.startSession())
        .then(_session => {
            session = _session;
            session.startTransaction();

            return Transactions.updateOne( { phone: item.phone, txnRef: item.txnRef }, { status }, {session: session})
        })
        .then(() => {
            delete txn.totalPrice;
            txn.txnAt = moment().format();
            txn.status = status
            txn.description = errorMessage;

            return TxnHistory.create([txn], {session: session});
        })
        .then(() => session.commitTransaction())
        .then(() => session.endSession())
        .then(() => txn)
        .catch((err) => {
            console.log('err on update txn', err)
        })
}

const produce = (item) => {
    q.send(item)
}

module.exports = produce

console.log("queue is running")
setInterval(async() => {
    if (!q.isEmpty() && emptyBefore) {
        console.log("process running")
        emptyBefore = false
        await process()
    }
    
    if (q.isEmpty()) {
        emptyBefore = true
    }
}, 1000)