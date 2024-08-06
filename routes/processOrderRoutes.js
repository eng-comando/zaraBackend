const express = require("express");
const router = express.Router();

const orderController = require('../controllers/orderController');

router.get('/allorders', orderController.allorders);

router.post('/sendOrder', orderController.order);

router.delete('/order/:id', orderController.deleteOrder);

router.get('/order/:id', orderController.getOrderById);

module.exports = router;