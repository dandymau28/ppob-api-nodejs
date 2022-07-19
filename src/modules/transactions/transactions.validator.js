const { param, body } = require('express-validator');

const validators = {
    validateID: [
        param('category').exists({ checkNull: true }).withMessage('Category is required'),
        param('customerNo').exists({ checkNull: true }).withMessage('Customer ID is required')
    ],
    purchaseProduct: [
        param('id').exists({ checkNull: true }).withMessage('Product ID is required'),
        body('txn_number').exists({ checkFalsy: true }).withMessage('Customer Number is required')
    ]
};

module.exports = validators;