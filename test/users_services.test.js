const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://mongodb:VY5jAiyr9aSf2XPJ@cluster0.8m3glek.mongodb.net/?retryWrites=true&w=majority');

const userServices = require('../src/modules/users/users_services');

const phoneNumberCases = [
    ['082139230782', false],
    ['0812345678910', true],
    ['088821312331', false],
    ['089923123312', false]
];

const OTPCases = [
    ['081234567890', false],
    ['082139230782', false],
    ['0812345678910', true],
    ['00000000000000', false]
]

// const GetOTPCases = [
//     ['081234567890', '123456', null],
//     ['082139230782', '000000', null],
//     ['0812345678910', '999999', true],
//     ['00000000000000', '999999', null]
// ]

describe('Check Phone Number Service', () => {
    test.each(phoneNumberCases)("Phone# %p expect result %p",
    (phoneNumber, expectedResult) => {
        return expect(userServices.IsPhoneNumberExist(phoneNumber)).resolves.toBe(expectedResult);
    })
})

describe('Create OTP Service', () => {
    test.each(OTPCases)("Phone# %p expect result %p",
    (phoneNumber, expectedResult) => {
        return expect(userServices.CreateOTP(phoneNumber)).resolves.toBe(expectedResult);
    }, 30000)
})

// describe('Get OTP Service', () => {
//     test.each(GetOTPCases)("Phone# %p with OTP %p expect result %p",
//     (phoneNumber, otp, expectedResult) => {
//         return expect(userServices.GetOTP(phoneNumber, otp)).resolves.toBe(expectedResult);
//     }, 30000)
// })