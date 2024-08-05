const asyncHandler = require("express-async-handler");
const axios = require('axios');
const CartItem = require("../models/CartItem");
const Order = require("../models/Order");
const nodemailer = require('nodemailer');

exports.order = asyncHandler(async (req, res, next) => {
    const items = req.body.items;

    const cartItems = await Promise.all(items.map(async (itemData) => {
        const cartItem = new CartItem({
            link: itemData.link,
            name: itemData.name,
            price: itemData.price,
            sizes: itemData.sizes
        });
        await cartItem.save();
        return cartItem;
    }));

    const order = new Order({
        items: cartItems.map(cartItem => cartItem._id),
        phoneNumber: req.body.phoneNumber,
        callNumber: req.body.callNumber,
        email: req.body.email,
        name: req.body.name,
        status: req.body.status,
        price: req.body.price
    });

    await order.save();

    res.send("Added");
});

exports.allorders = asyncHandler(async (req, res, next) => {
    let orders = await Order.find({});
    res.send(orders);
});

exports.getOrderById = asyncHandler(async (req, res, next) => {
    try {
      const orderId = req.params.id;
  
      const order = await Order.findById(orderId).populate('items');
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      res.json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  