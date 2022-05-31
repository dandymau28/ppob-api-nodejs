const userService = require('./users_services');
const response = require('../../../response');
const http = require('../../../response/http_code');
const { validationResult } = require('express-validator');

const controllers = {
    register: async(req, res) => {
        try {
            const errors = validationResult(req);
    
            if (!errors.isEmpty()) {
                return response.error(res, http.BAD_REQUEST, errors.array(), 'Invalid request');
            }
    
            const { no_handphone, password, mac_address } = req.body;

            var phoneExist = await userService.IsPhoneNumberExist(no_handphone);

            if (phoneExist) {
                return response.badRequest(res, ['phone number already used'], 'Invalid input');
            }

            user = {
                noHandphone: no_handphone,
                password: password,
                macAddress: mac_address
            };

            await userService.StoreUser(user);

            return response.success(res, null, 'success');
        } catch(err) {
            console.error(err);
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
                return response.badRequest(res, ['phone is not registered'], 'Invalid request');
            }

            var OTPsent = await userService.CreateOTP(phone);

            if (!OTPsent) {
                throw new Error('Failed to login, please try again');
            }

            return response.success(res, null, 'OTP generated');
        } catch (err) {
            console.log("login err: ", err);
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

            if (!otp) {
                return response.badRequest(res, ['Invalid OTP'], 'Invalid request');
            }

            var user = await userService.GetOTP(noHandphone, otp);

            if (!user) {
                return response.badRequest(res, ['Invalid OTP'], 'Invalid request');
            }

            let now = new Date();
            let otpExpire = new Date(user.otpExpire);

            if (otpExpire < now) {
                return response.badRequest(res, ['OTP Expired'], 'Invalid request');
            }

            return response.success(res, null, 'OTP verified');
        } catch(err) {
            console.log("verify otp err: ", err);
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
            return response.internalError(res, err, 'internal server error');
        }
    }

}

module.exports = controllers;