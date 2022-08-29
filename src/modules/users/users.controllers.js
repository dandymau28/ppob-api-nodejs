const userService = require('./users.services');
const response = require('../../../response');
const http = require('../../../response/http_code');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const controllers = {
    register: async(req, res) => {
        try {
            const errors = validationResult(req);
    
            if (!errors.isEmpty()) {
                return response.error(res, http.BAD_REQUEST, errors.array(), 'Invalid request');
            }
    
            let { no_handphone, password, mac_address } = req.body;

            var phoneExist = await userService.IsPhoneNumberExist(no_handphone);

            if (phoneExist) {
                return response.badRequest(res, null, 'Phone number already registered');
            }

            let encryptedPassword = null;
            if (password) {
                let saltRounds = 12;
                encryptedPassword = bcrypt.hashSync(password, saltRounds);
            }

            let user = {
                noHandphone: no_handphone,
                password: encryptedPassword,
                macAddress: mac_address
            };

            let register = await userService.StoreUser(user);

            if (!register) {
                return response.error(res, http.CONFLICT, null, 'Unable to register');
            }

            let userRegistered = await userService.GetUserByPhone(no_handphone);

            if (!userRegistered) {
                return response.error(res, http.CONFLICT, null, 'Unable to register');
            }

            return response.success(res, userRegistered, 'success');
        } catch(err) {
            console.log(err.stack)
            return response.error(res, http.INTERNAL_SERVER_ERROR, err, 'internal server error');
        }
    },
    generateOTP: async(req, res) => {
        try {
            const errors = validationResult(req);
    
            if (!errors.isEmpty()) {
                return response.error(res, http.BAD_REQUEST, errors.array(), 'Invalid request');
            }

            const { phone } = req.params;

            var phoneRegistered = await userService.IsPhoneNumberExist(phone);

            if (!phoneRegistered) {
                return response.badRequest(res, null, 'Phone is not registered');
            }

            var OTPsent = await userService.CreateOTP(phone);

            if (!OTPsent) {
                return response.internalError(res, null, 'Failed to login, please try again');
            }

            return response.success(res, { otp: OTPsent }, 'OTP generated');
        } catch (err) {
            console.log(err.stack)
            return response.internalError(res, err, 'internal server error');
        }
    },
    verifyOTP: async(req, res) => {
        try {
            const errors = validationResult(req);
    
            if (!errors.isEmpty()) {
                return response.error(res, http.BAD_REQUEST, errors.array(), 'Invalid request');
            }

            const noHandphone = req.params.phone;
            const otp = req.query?.otp;
            const typeOTP = req.query?.type;

            if (!otp) {
                return response.badRequest(res, null, 'Invalid OTP');
            }

            var user = await userService.GetOTP(noHandphone, otp);

            if (!user) {
                return response.badRequest(res, null, 'Invalid OTP');
            }

            let now = new Date();
            let otpExpire = new Date(user.otpExpire);

            if (otpExpire < now) {
                return response.badRequest(res, null, 'OTP Expired');
            }

            let resData = {}

            if (typeOTP === 'login') {
                resData = await userService.CreateToken(noHandphone);
    
                if (!token) {
                    return response.badRequest(res, null, 'Fail to verify OTP');
                }    
            }
            
            const removeToken = await userService.removeOTP(noHandphone);

            if (!removeToken) {
                return response.badRequest(res, null, 'Fail to verify OTP');
            }
            
            return response.success(res, resData, 'OTP verified');
        } catch(err) {
            console.log(err.stack)
            return response.internalError(res, err, 'internal server error');
        }
    },
    getProfile: async(req, res) => {
        try {
            const { phone } = req.params;
    
            if (!phone) {
                return response.badRequest(res, null, 'Phone number params is required');
            }

            let user = await userService.GetProfileByPhone(phone);
    
            if(!user) {
                return response.error(res, http.NOT_FOUND, null, 'Resource not found');
            }

            return response.success(res, user, 'success');
        } catch (err) {
            console.log(err.stack)
            return response.internalError(res, err, 'internal server error');
        }
    },
    refreshToken: async(req, res) => {
        try {
            let { token } = req;
            let refreshToken = req.query?.refresh_token;
            let { phone } = req.params;

            let isRefreshAvailable = await userService.CheckRefreshToken(phone, token, refreshToken);

            if (!isRefreshAvailable) {
                return response.badRequest(res, null, 'Refresh token failed. Use login instead');
            }

            let expireRefresh = new Date(isRefreshAvailable.refreshTokenExpire);
            let now = new Date();

            if (expireRefresh < now) {
                return response.badRequest(res, null, 'Refresh token expired. Use login instead');
            }

            let refreshedToken = await userService.CreateToken(phone);

            if (!refreshedToken) {
                return response.badRequest(res, null, 'Refresh token failed');
            }

            return response.success(res, refreshedToken, 'success');
        } catch(err) {
            console.log(err.stack)
            return response.internalError(res, err, 'internal server error');
        }
    },
    checkID: async(req, res) => {
        const { type, id } = req.params;

        try {
            switch (type) {
                case 'phone':
                    var exist = await userService.IsPhoneNumberExist(id);
                    break;            
                // case 'username':
                //     var exist = await userService.IsUsernameExist(id);
                //     break;
                // case 'email':
                //     var exist = await userService.IsEmailExist(id);
                //     break;
                default:
                    var error = 'no type found';
                    break;
            }

            if (error) {
                return response.error(res, http.BAD_REQUEST, null, error);
            }

            if (exist) {
                return response.error(res, http.CONFLICT);
            }
            return response.success(res);
        } catch (err) {
            console.log(err.stack)
            return response.internalError(res, err, 'internal server error');
        }
    }

}

module.exports = controllers;