const response = require('../response');
const http = require('../response/http_code');
const Users = require('../src/models/users');

module.exports.reqAuth = async(req, res, next) => {
    try {
        const bearerToken = req.headers['authorization'];
        let { phone } = req.params

        if (!bearerToken) return response.error(res, http.UNAUTHORIZED, null, 'No token found');
    
        let [,authToken] = bearerToken.split(' ');

        if (!authToken) {
            return response.error(res, http.UNAUTHORIZED, null, 'No token found');
        }
    
        // let decodedToken = Buffer.from(authToken, 'base64').toString('ascii');

        // let [phone, token] = decodedToken.split(':');    

        // let user = await Users.findOne({ noHandphone: phone, token: authToken });
        let user = await Users.findOne({ token: authToken });

        console.log(user);

        if (!user) {
            return response.error(res, http.UNAUTHORIZED, null, 'Credentials invalid');
        }

        let requestPath = req.path.split('/')[2];

        if (req.query.refresh_token && requestPath === 'refresh-token') {
            req.token = authToken
            next();
        } else {
            let tokenExpire = new Date(user.tokenExpire);
            let now = new Date();
    
            if (now > tokenExpire) {
                return response.error(res, http.UNAUTHORIZED, null, 'Token expired');
            }

            req.user = user;
            next();
        }
    } catch(err) {
        console.log(err.stack);
        return response.internalError(res, err, 'Internal server error');
    }
}