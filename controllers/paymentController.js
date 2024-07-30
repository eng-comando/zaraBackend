const asyncHandler = require("express-async-handler");
const jwt = require('jsonwebtoken');
const axios = require('axios');
const CartItem = require("../models/CartItem");
const Order = require("../models/Order");

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

exports.order = asyncHandler(async (req, res, next) => {
    const items = req.body.items;

    const cartItems = await Promise.all(items.map(async (itemData) => {
        const cartItem = new CartItem({
            link: itemData.link,
            name: itemData.name,
            quantity: itemData.quantity,
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
