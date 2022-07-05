const express = require("express");
const router = express.Router();
const userController = require("./users.controllers");
const userValidator = require("./users.validators");
const { reqAuth } = require("../../../middleware/req_auth");

router.post('/register', userValidator.register, userController.register);
router.post('/:phone/generate-otp', userValidator.generateOTP, userController.generateOTP);
router.patch('/:phone/verify-otp', userValidator.verifyOTP, userController.verifyOTP);
router.get('/:phone/profile', reqAuth, userController.getProfile);
router.post('/:phone/refresh-token', reqAuth, userController.refreshToken);
router.head('/:type/check/:id', userController.checkID);

module.exports = router;
