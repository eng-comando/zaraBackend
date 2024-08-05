const express = require("express");
const router = express.Router();

const paymentController = require('../controllers/paymentController');

router.get('/token', paymentController.token);

router.post('/payment', paymentController.payment);

router.post('/sendConfirmationEmail', paymentController.sendConfirmationEmail);

module.exports = router;