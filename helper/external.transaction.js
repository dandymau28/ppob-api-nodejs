const {process: logger} = require('./logger')
const axios = require('axios').default
const md5 = require('md5')

const external = {
    digiTopup: async({ code, txnNumber, txnRef }) => {
        logger.log('info', 'call topup digiflazz ...');
        let url = process.env.DIGI_URL + '/transaction';
        let username = process.env.DIGI_USERNAME;
        let apiKey = process.env.DIGI_API_KEY;
        let isDev = process.env.NODE_ENV === 'development';
    
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
        
        logger.log('info', 'call topup digiflazz done');
        return await axios.post(url, body)
    }
}

module.exports = external