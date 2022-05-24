const userServices = require('../modules/users/users_services');

const phoneNumberCases = [
    ['082139230782', false],
    ['081234567890', true],
    ['088821312331', false],
    ['089923123312', false]
];

describe('Check Phone Number Service', () => {
    test.each(phoneNumberCases)("Phone# %p expect result %p",
    (phoneNumber, expectedResult) => {
        return expect(userServices.IsPhoneNumberExist(phoneNumber)).resolves.toBe(expectedResult);
    })
})