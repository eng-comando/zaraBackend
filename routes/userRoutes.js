const express = require("express");
const router = express.Router();

const userController = require('../controllers/userController');

router.post('/signup', userController.signup);

router.post('/login', userController.login);

router.post('/loginAdmin', userController.loginAdmin);

router.post('/verify-code', userController.verifyCode);

//router.post('/signupAdmin', userController.signupAdmin);

module.exports = router;