const asyncHandler = require("express-async-handler");
const axios = require('axios');
const CartItem = require("../models/CartItem");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const SECRET_KEY_ADMIN = process.env.SECRET_KEY_ADMIN;

const authAdmin = (req, res, next) => {
  try {
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
          return res.status(401).json({ message: "Acesso negado" });
      }
    
      const verified = jwt.verify(token, SECRET_KEY_ADMIN);
      req.user = verified;
      next();
  } catch (error) {
      res.status(400).json({ message: "Invalid token" });
  }
};

exports.order = asyncHandler(async (req, res) => {
  try {
      const { items, phoneNumber, callNumber, email, name, status, price, transactionId } = req.body;

      if (!items || !Array.isArray(items)) {
          return res.status(400).json({ message: "Dados dos itens inválidos" });
      }

      if (!transactionId) {
          return res.status(400).json({ message: "ID da transação é obrigatório" });
      }

      const payment = await Payment.findOne({ transactionId: transactionId });

      if (!payment || payment.status !== 'completed' || payment.amount != price || payment.phone != phoneNumber) {
          return res.status(400).json({ message: "Transação inválida ou incompleta" });
      }

      const cartItems = await Promise.all(items.map(async (itemData) => {
          const { link, name, price, sizes, color, productId } = itemData;
          
          if (!link || !name || !price || !sizes || !productId) {
              throw new Error('Dados do item inválidos');
          }

          const cartItem = new CartItem({
              link,
              name,
              price,
              sizes,
              color,
              productId
          });

          await cartItem.save();
          return cartItem;
      }));

      const order = new Order({
          items: cartItems.map(cartItem => cartItem._id),
          phoneNumber,
          callNumber,
          email,
          name,
          status,
          price,
          payment
      });

      await order.save();
      res.status(200).json({ success: true, message: "Pedido adicionado com sucesso" });

  } catch (error) {
      console.error('Server Error:', error);
      res.status(500).json({ success: false, message: "Falha ao registrar pedido", error: 'Erro Interno do Servidor' });
  }
});


exports.allorders = [authAdmin, asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({});
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error retrieving orders:', error);
    res.status(500).json({ message: "Failed to retrieve orders", error: 'Internal Server Error' });
  }
})];

exports.getOrderById = [authAdmin, asyncHandler(async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId).populate('items');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error retrieving order:', error);
    res.status(500).json({ message: 'Failed to retrieve order', error: 'Internal Server Error' });
  }
})];

exports.deleteOrder = [authAdmin, asyncHandler(async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await CartItem.deleteMany({ _id: { $in: order.items }});
    await Order.findByIdAndDelete(orderId);

    res.status(200).json({ message: 'Order and associated CartItems deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Failed to delete order', error: 'Internal Server Error' });
  }
})];

exports.updateOrderStatus = [authAdmin, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status', error: 'Internal Server Error' });
  }
})];