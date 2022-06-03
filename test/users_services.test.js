const mongoose = require('mongoose');

beforeEach(() => {
    return mongoose.connect('mongodb+srv://mongodb:VY5jAiyr9aSf2XPJ@cluster0.8m3glek.mongodb.net/?retryWrites=true&w=majority');
})

afterEach(() => {
    return mongoose.connection.close();
})


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

const TokenCases = [
    ['081234567890'],
    ['082139230782'],
    ['0812345678910'],
    ['00000000000000'],
    ['0899213211234'],
    ['8821312312'],
    ['092132172312'],
    ['abcdef'],
    ['001231']
]

var extendCases = {
    haveValueOrFalse: {
        haveValueOrFalse(received) {
            if (received) {
                return {
                    message: () => `value expected ${received}`,
                    pass: true
                }
            } else if (received === false) {
                return {
                    message: () => `value false`,
                    pass: true
                }
            } else {
                return {
                    message: () => `value got ${received}`,
                    pass: false
                }
            }
        }        
    }
}

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
    }, 30000)
})

describe('Create OTP Service', () => {
    expect.extend(extendCases.haveValueOrFalse)

    test.each(OTPCases)("Phone# %p expect result %p",
    (phoneNumber, expectedResult) => {
        return expect(userServices.CreateOTP(phoneNumber)).resolves.haveValueOrFalse();
    }, 30000)
})

describe('Create Token Service', () => {
    expect.extend(extendCases.haveValueOrFalse)

    test.each(TokenCases)("Phone# %p",
    (phoneNumber) => {
        return expect(userServices.CreateToken(phoneNumber)).resolves.haveValueOrFalse();
    }, 30000)
})