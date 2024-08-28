const asyncHandler = require("express-async-handler");
const jwt = require('jsonwebtoken');
const axios = require('axios');
const CartItem = require("../models/CartItem");
const Order = require("../models/Order");
const nodemailer = require('nodemailer');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;
const HOST = process.env.HOST;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

exports.token = asyncHandler(async (req, res, next) => {
    try {
        const data = {
            role: 'guest',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
        };

        const token = jwt.sign(data, SECRET_KEY);
        res.json({token: token});
    } catch (error) {
        console.error('Erro ao gerar token:', error);
        res.status(400).json({ error: 'Erro ao gerar token' });
    }
});

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
        const payloadC2b = {
            "client_id": CLIENT_ID,
            "amount": req.body.amount,
            "phone": req.body.phone,
            "reference": "PagamentoZaraMZ"
        };

        // Solicitação para realizar transação de pagamento
        const paymentResponse = await axios.post(ENDPOINT_URL, payloadC2b, { headers: header });
        console.log('Transação realizada com sucesso:', paymentResponse.data);

        res.send("Transação realizada com sucesso");
    } catch (error) {
        console.error('Erro ao realizar transação:', error);

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
        console.error('Erro ao enviar e-mail: ', error);
        res.send('Erro ao enviar e-mail: ', error);
    }
    res.send('Sent');
});
