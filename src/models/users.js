const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Users = new Schema({
    username: String,
    noHandphone: {
        type: String,
        max: [15, 'Your number is too long']
    },
    email: String,
    password: String,
    pin: String,
    pinStatus: Boolean,
    macAddress: String,
    token: String,
    tokenExpire: Date,
    refreshToken: String,
    refreshTokenExpire: Date,
    otp: {
        type: String,
        max: 6,
        min: 6
    },
    otpExpire: Date,
    loginTime: Date,
    loginClient: mongoose.Types.ObjectId,
    deletedAt: Date
}, {
    timestamps: true
})

module.exports = mongoose.model('users', Users);