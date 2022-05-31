const { body, param, query } = require('express-validator');

const validators = {
    register: [
        body('no_handphone').isLength({ min: 13, max:15 }).withMessage('Phone number must be at least 13 characters long'),
        body('mac_address').exists({ checkNull: true }).withMessage('Mac address is required')
    ],
    generateOTP: [
        param('phone').isLength({ min:13, max:15 }).withMessage('Phone number must be at least 13 characters long')
    ],
    verifyOTP: [
        param('phone').isLength({ min:13, max:15 }).withMessage('Invalid phone number'),
        query('otp').isLength({ min:6, max:6 }).withMessage('Invalid OTP')
    ]
};

module.exports = validators;