const db = require('../../../config/database');
const Users = require('../../models/users');
const randomstring = require('randomstring');


const services_postgres = {
    IsPhoneNumberExist: async(phoneNumber) => {
        const exist = await db.table('users').select('no_handphone').where('no_handphone', phoneNumber).first();

        if (exist) return true
        return false
    },
    IsUsernameExist: async(username) => {
        const exist = await db.table('users').select('username').where('username', username).first();

        if (exist) return true
        return false
    },
    IsEmailExist: async(email) => {
        const exist = await db.table('users').select('email').where('email', email).first();

        if (exist) return true
        return false
    }
}

const services = {
    IsPhoneNumberExist: async(phoneNumber) => {
        const exist = await Users.findOne({ noHandphone: phoneNumber});

        if (exist) return true
        return false
    },
    StoreUser: async(user) => {
        const store = await Users.create(user);

        return store;
    },
    GetUserByPhone: async(phoneNumber) => {
        const user = await Users.findOne({noHandphone: phoneNumber}).select('-password');

        return user;
    },
    CreateOTP: async(phoneNumber) => {
        const OTP = generateOTP();

        let expiryDate = new Date();
        expiryDate.setMinutes( expiryDate.getMinutes() + 30 );

        const update = await Users.updateOne({noHandphone: phoneNumber}, { otp: OTP, otpExpire: expiryDate });

        if (update.matchedCount > 0) {
            return OTP
        }
        return false
    },
    GetOTP: async(phoneNumber, otp) => {
        const user = await Users.findOne({ noHandphone: phoneNumber, otp: otp });

        return user
    },
    CreateToken: async(phoneNumber) => {
        const token = randomstring.generate(7);
        const refreshToken = randomstring.generate(10);

        let expiryDate = new Date();
        expiryDate.setMinutes( expiryDate.getMinutes() + 2 );
        // expiryDate.setDate( expiryDate.getDate() + 1 );

        let expiryRefreshDate = new Date();
        expiryRefreshDate.setDate( expiryRefreshDate.getDate() + 3);

        const update = await Users.updateOne({noHandphone: phoneNumber}, 
            { 
                token: token, 
                tokenExpire: expiryDate, 
                refreshToken: refreshToken, 
                refreshTokenExpire: expiryRefreshDate
            });

        if (update.matchedCount > 0) {
            return {
                token,
                tokenExpire: expiryDate,
                refreshToken,
                refreshTokenExpire: expiryRefreshDate
            }
        }
        return false
    },
    removeOTP: async(phoneNumber) => {
        const remove = await Users.updateOne({ noHandphone: phoneNumber }, 
        {
            otp: null
        });

        if (remove.matchedCount > 0) {
            return true
        }
        return false
    },
    GetProfileByPhone: async(phoneNumber) => {
        const user = await Users.findOne({ phoneNumber: phoneNumber}).select(['username', 'noHandphone', 'macAddress']);

        return user;
    },
    CheckRefreshToken: async(phoneNumber, token, refreshToken) => {
        const user = await Users.findOne({ noHandphone: phoneNumber, token: token, refreshToken: refreshToken});
        console.log(user);

        if (user) {
            return user;
        }
        return false;
    }
};


var generateOTP = () => {
    return randomstring.generate({
        length: 6,
        charset: 'numeric'
    });
}

module.exports = services;