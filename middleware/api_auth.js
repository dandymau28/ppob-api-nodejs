const response = require('../response');
const http = require('../response/http_code');

module.exports.apiAuth = (req, res, next) => {
    const clientKey = req.headers['x-api-key'];
    const digiflazzDelivery = req.headers['x-digiflazz-delivery'];
    // const hookSecret = process.env.HOOK_SECRET

    try {
        if (!digiflazzDelivery) {
            //check if api key exist
            if (!clientKey) {
                return response.error(res, http.UNAUTHORIZED, null, 'Invalid API Key');
            }
    
            let serverKey = process.env.API_KEY;
            
            //compare api key
            if (serverKey !== clientKey) {
                return response.error(res, http.UNAUTHORIZED, null, 'Invalid API Key');
            }
            
        }

        next();
    } catch (err) {
        return response.internalError(res, err, 'internal server error');
    }
}