const express = require("express");
const router = express.Router();

const paymentController = require('../controllers/paymentController');

router.get('/token', paymentController.token);

router.get('/allorders', paymentController.allorders);

router.post('/payment', paymentController.payment);

router.post('/sendOrder', paymentController.order);

module.exports = router;