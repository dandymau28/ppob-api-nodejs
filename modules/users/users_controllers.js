const userService = require('./users_services');
const response = require('../../response');
const http = require('../../response/http_code');

const controllers = {
    register: (req, res) => {

    },
    checkID: async(req, res) => {
        const { type, id } = req.params;

        try {
            switch (type) {
                case 'phone':
                    var exist = await userService.IsPhoneNumberExist(id);
                    break;            
                case 'username':
                    var exist = await userService.IsUsernameExist(id);
                    break;
                case 'email':
                    var exist = await userService.IsEmailExist(id);
                    break;
                default:
                    var exist = false;
                    break;
            }

            if (exist) {
                return response.error(res, http.CONFLICT);
            }
            return response.success(res);
        } catch (err) {
            return response.internalError(res, err, 'internal server error');
        }
    }

}

module.exports = controllers;