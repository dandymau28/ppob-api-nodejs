const db = require('../../../config/database');
const Users = require('../../models/users');
const Wallets = require('../../models/wallets');
const randomstring = require('randomstring');
const mongoose = require('mongoose')


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
        let session = null

        return Users.createCollection()
        .then(() => mongoose.startSession())
        .then(_session => {
            session = _session;
            session.startTransaction();

            return Users.create([user], {session: session});
        })
        .then(() => {

            return Wallets.create([{ user: { phone: user.noHandphone }, balance: 0 }], {session: session});
        })
        .catch(() => session.abortTransaction())
        .then(() => session.commitTransaction())
        .then(() => session.endSession())
        .then(() => user)
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
        // expiryDate.setMinutes( expiryDate.getMinutes() + 2 );
        expiryDate.setDate( expiryDate.getDate() + 1 );

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

        if (user) {
            return user;
        }
        return false;
    },
    UpdatePIN: async(pin, phone) => {
        let update = await Users.updateOne({ noHandphone: phone }, { pin, pinStatus: true })

        return update.matchedCount > 0;
    },
    VerifyPIN: async(pin, phone) => {
        const user = await Users.findOne({noHandphone: phone, pin: pin});

        if (user) {
            return true
        }

        return false
    }
};


var generateOTP = () => {
    return randomstring.generate({
        length: 6,
        charset: 'numeric'
    });
}

module.exports = services;