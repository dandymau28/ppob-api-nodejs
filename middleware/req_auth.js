const response = require('../response');
const http = require('../response/http_code');
const Users = require('../src/models/users');

module.exports.reqAuth = async(req, res, next) => {
    try {
        const bearerToken = req.headers['authorization'];

        if (!bearerToken) return response.error(res, http.UNAUTHORIZED, null, 'No token found');
    
        let token = bearerToken.split(' ')[1];
    
        const { phone } = req.params
    
        if (!token) {
            return response.error(res, http.UNAUTHORIZED, null, 'No token found');
        }

        let user = await Users.findOne({ noHandphone: phone, token: token });

        if (!user) {
            return response.error(res, http.UNAUTHORIZED, null, 'Credentials invalid');
        }

        let requestPath = req.path.split('/')[2];

        if (req.query.refresh_token && requestPath === 'refresh-token') {
            req.token = token
            next();
        } else {
            let tokenExpire = new Date(user.tokenExpire);
            let now = new Date();
    
            if (now > tokenExpire) {
                return response.error(res, http.UNAUTHORIZED, null, 'Token expired');
            }

            next();
        }
    } catch(err) {
        console.log(err.stack);
        return response.internalError(res, err, 'Internal server error');
    }
}