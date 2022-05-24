const express = require("express");
const router = express.Router();
const userController = require("./users_controllers");
// const { reqAuth } = require("../../middleware/req_auth");

/* GET users listing. */
// router.get("/", function (req, res, next) {
//   res.send("User API");
// });

router.head('/:type/check/:id', userController.checkID)

module.exports = router;
