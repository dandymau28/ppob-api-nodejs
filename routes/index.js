var express = require('express');
var router = express.Router();

var userRouter = require('../src/modules/users/users.routes');
var productRouter = require('../src/modules/products/products.routes');

router.use('/users', userRouter)
router.use('/products', productRouter)

router.use('/', function(req, res, next) {
  res.status(404).json({message: 'no route found'});
});

module.exports = router;
