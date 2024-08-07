const asyncHandler = require("express-async-handler");
const jwt = require('jsonwebtoken');
const axios = require('axios');
const CartItem = require("../models/CartItem");
const Order = require("../models/Order");
const nodemailer = require('nodemailer');

exports.token = asyncHandler(async (req, res, next) => {
    try {
        const data = {
            role: 'guest',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
        };

        const token = jwt.sign(data, 'secret_ecom');
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
            client_id: '9bd4abf6-fb1d-4563-bcef-fbf3c8c4bbca',
            client_secret: 'HrL7aHlpEDL9G8wyoAEoysXCiGA1G0OAgNmLcE9t'
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
            "client_id": "9bd4abf6-fb1d-4563-bcef-fbf3c8c4bbca",
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
    host: 'smtp.hostinger.com', 
    port: 587, 
    secure: false, 
    auth: {
      user: 'noreply@zara-mz.shop', 
      pass: 'Aniana@2017'
    }
});
exports.sendConfirmationEmail = asyncHandler(async (req, res, next) => {
    const mailOptions = {
        from: 'noreply@zara-mz.shop',
        to: req.body.recipientEmail,
        subject: req.body.subject,
        html: req.body.html
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Erro ao enviar e-mail: ', error);
        res.send('Erro ao enviar e-mail: ', error);
    }
    res.send('Sent');
});
