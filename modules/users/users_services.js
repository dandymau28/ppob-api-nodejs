const db = require('../../config/database');


const services = {
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

module.exports = services;