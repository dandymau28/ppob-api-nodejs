const { body, param } = require('express-validator');

const validators = {
    checkBalance: [
        param('phone').isLength({ min: 11, max:14 }).withMessage('Phone number must be at least 11 characters long').isNumeric().withMessage('Phone is not valid')
    ],
    topupBalance: [
        param('phone').isLength({ min:11, max:14 }).withMessage('Phone number must be at least 11 - 14 characters long').isNumeric().withMessage('Phone is not valid'),
        body('amount').exists({ checkFalsy: true }).withMessage('Amount is required').isNumeric().withMessage('Amount must be number')
    ],
    history: [
        param('phone').isLength({ min:11, max:14 }).withMessage('Phone number must be at least 11 - 14 characters long').isNumeric().withMessage('Phone is not valid')
    ]
};

module.exports = validators;