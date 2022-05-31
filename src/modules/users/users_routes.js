const express = require("express");
const router = express.Router();
const userController = require("./users_controllers");
const userValidator = require("./users_validators");
// const { reqAuth } = require("../../middleware/req_auth");

router.post('/register', userValidator.register, userController.register);
router.patch('/:phone/generate-otp', userValidator.generateOTP, userController.generateOTP);
router.get('/:phone/verify-otp', userValidator.verifyOTP, userController.verifyOTP);
router.head('/:type/check/:id', userController.checkID);

module.exports = router;
