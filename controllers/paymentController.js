const asyncHandler = require("express-async-handler");
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const CartItem = require("../models/CartItem");
const Order = require("../models/Order");
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;
const HOST = process.env.HOST;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const calculateTotalAmount = async (cartItems) => {
    let totalAmount = 0;

    try {
        const all_products = await Product.find({});

        for (const item in cartItems) {
            const cartItem = cartItems[item];
            
            let itemInfo = all_products.find((product) => product.id === Number(item));

            if (itemInfo) {
                let totalQuantity = 0;

                for (const key in cartItem) {
                    if (key.startsWith('quantity') && cartItem[key] > 0) {
                        totalQuantity += cartItem[key];
                    }
                }
                totalAmount += itemInfo.new_price * totalQuantity;
            }
        }
    } catch (error) {
        console.error('Error calculating total amount:', error);
        throw new Error('Erro ao calcular o valor total');
    }
    return totalAmount;
};


exports.payment = asyncHandler(async (req, res, next) => {
    try {
        const tokenResponse = await axios.post('https://e2payments.explicador.co.mz/oauth/token', {
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        });

        const accessToken = tokenResponse.data.access_token;
        console.log(accessToken);

        const ENDPOINT_URL = "https://e2payments.explicador.co.mz/v1/c2b/mpesa-payment/702645";
        const header = {
            "Authorization": "Bearer " + accessToken,
            "Accept": "application/json",
            "Content-Type": "application/json"
        };

        const recalculatedAmount = await calculateTotalAmount(req.body.cartItems); 

        const payloadC2b = {
            "client_id": CLIENT_ID,
            "amount": recalculatedAmount,
            "phone": req.body.phone,
            "reference": "PagamentoZaraMZ"
        };

        const paymentResponse = await axios.post(ENDPOINT_URL, payloadC2b, { headers: header });
        console.log('Transação realizada com sucesso:', paymentResponse.data);

        const transactionId = uuidv4();

        const payment = new Payment({
            transactionId: transactionId,
            amount: recalculatedAmount,
            phone: req.body.phone,
            status: 'completed' 
        });

        await payment.save();

        res.send({ success: true, message: "Transação realizada com sucesso", transactionId: transactionId });
    } catch (error) {
        console.error('Error trying to make payment:', error);

        res.send("Erro ao realizar transação");
    }
});

const transporter = nodemailer.createTransport({
    host: HOST, 
    port: 587, 
    secure: false, 
    auth: {
      user: EMAIL, 
      pass: PASSWORD
    }
});

exports.sendConfirmationEmail = asyncHandler(async (req, res, next) => {
    try {
        const mailOptions = {
            from: EMAIL,
            to: req.body.recipientEmail,
            subject: req.body.subject,
            html: req.body.html
        };
    
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error trying to send email: ', error);
        res.send('Erro ao enviar e-mail: ', error);
    }
    res.send('Sent');
});
