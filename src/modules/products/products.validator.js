const { param } = require('express-validator');

const validators = {
    getProductByOperator: [
        param('category').exists({ checkNull: true }).withMessage('Category is required'),
        param('operator').exists({ checkNull: true }).withMessage('Operator is required')
    ]
};

module.exports = validators;