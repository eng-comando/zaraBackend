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
const API_HOST = process.env.API_HOST;
const PAYSUITE_AUTH_KEY = process.env.PAYSUITE_AUTH_KEY;
let productQuantities = {}

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

                if (totalQuantity > 0) {
                    productQuantities[itemInfo.id] = totalQuantity;
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

// Criar pagamento
exports.payment = asyncHandler(async (req, res) => {
    try {
        // 1. Calcular valor total a pagar
        const recalculatedAmount = await calculateTotalAmount(req.body.cartItems);

        // 2. Criar referência única
        const paymentReference = `ZARA-${uuidv4().replace(/-/g, '').slice(0, 14)}`;

        // 3. Montar payload PaySuite
        const body = {
            amount: recalculatedAmount.toFixed(2),
            reference: paymentReference,
            description: `Pagamento de compra Zara MZ - ${paymentReference}`,
            return_url: `http://localhost:3000/payment?transactionId=${paymentReference}`, // frontend receberá transactionId
            callback_url: `${API_HOST}/callback`
        };

        // 4. Criar pagamento na PaySuite
        const paysuiteResponse = await axios.post(
            "https://paysuite.tech/api/v1/payments",
            body,
            {
                headers: {
                    Authorization: `Bearer ${PAYSUITE_AUTH_KEY}`,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                }
            }
        );

        const data = paysuiteResponse.data;

        if (data.status !== "success") {
            return res.status(400).json({
                success: false,
                message: data.message || "Erro ao criar pagamento na PaySuite"
            });
        }

        // 5. Salvar pagamento no banco com dados do cliente
        const payment = new Payment({
            paysuiteId: data.data.id,
            amount: data.data.amount,
            reference: data.data.reference,
            status: data.data.status, // "pending"
            checkoutUrl: data.data.checkout_url,
            phone: req.body.callNumber, 
            email: req.body.email,      
            name: req.body.name,
            cartItems: req.body.cartItems
        });
        await payment.save();

        // 6. Atualizar contagem de vendas
        const productQuantities = req.body.productQuantities || {};
        const bulkOps = [];

        for (const productId in productQuantities) {
            bulkOps.push({
                updateOne: {
                    filter: { id: Number(productId) },
                    update: { $inc: { num_sells: productQuantities[productId] } }
                }
            });
        }

        if (bulkOps.length > 0) {
            const result = await Product.bulkWrite(bulkOps);
            console.log(`Vendas atualizadas: ${result.modifiedCount} produtos`);
        }

        // 7. Retornar checkout_url ao frontend
        res.json({
            success: true,
            message: "Pagamento criado com sucesso",
            checkoutUrl: data.data.checkout_url,
            reference: data.data.reference
        });

    } catch (error) {
        console.error("Erro ao criar pagamento:", error?.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Erro interno ao processar pagamento",
            error: error?.response?.data || error.message
        });
    }
});

const generateCartDetailsHTML = (cartItems) => {
    if (!cartItems || !cartItems.length) return "<p>Carrinho vazio</p>";

    let details = '<table border="1" cellspacing="0" cellpadding="5" style="border-collapse: collapse; width: 100%;">';
    details += `
        <thead>
            <tr>
                <th>Produto</th>
                <th>Preço (MZN)</th>
                <th>Quantidade Total</th>
            </tr>
        </thead>
        <tbody>
    `;

    for (const item of cartItems) {
        const totalQuantity = (item.quantity0 || 0) + (item.quantity1 || 0) + (item.quantity2 || 0) || 1; // default 1 se não tiver qty
        details += `
            <tr>
                <td>${item.name || 'Nome não disponível'}</td>
                <td>${item.price || 'Preço não disponível'} MZN</td>
                <td>${totalQuantity}</td>
            </tr>
        `;
    }

    details += `</tbody></table>`;
    return details;
};


// Callback do PaySuite
exports.paymentCallback = asyncHandler(async (req, res) => {
    try {
        console.log("📩 Callback recebido da PaySuite:", req.body);

        const { event, data } = req.body;

        if (!event || !data || !data.id) {
            return res.status(400).json({ success: false, message: "Dados inválidos no callback." });
        }

        let status = "pending";

        if (event === "payment.success") {
            status = "paid";
        } else if (event === "payment.failed") {
            status = "failed";
        }

        // Atualizar status do pagamento no banco
        const updatedPayment = await Payment.findOneAndUpdate(
            { paysuiteId: data.id },
            { status },
            { new: true }
        );

        if (!updatedPayment) {
            console.warn("⚠️ Pagamento não encontrado para ID:", data.id);
            return res.status(404).json({ success: false, message: "Pagamento não encontrado." });
        }

        console.log("✅ Status do pagamento atualizado para:", status);

        // Se o pagamento foi confirmado, criar ordem automaticamente
        if (status === "paid") {

            let cartOrders = [];
            const cart = updatedPayment.cartItems[0] || {}; // carrinho salvo no Payment

            for (const key in cart) {
                const item = cart[key];
                const totalQuantity = (item.quantity0 || 0) + (item.quantity1 || 0) + (item.quantity2 || 0);

                if (totalQuantity > 0) {
                    cartOrders.push({
                        link: item.link,
                        name: item.name,
                        sizes: item.sizes,
                        price: item.price,
                        color: item.color,
                        productId: item.productId,
                        totalQuantity
                    });
                }
            }

            console.log("\nCarrinho:", cartOrders);

            // 1️⃣ Salvar cada item do carrinho no MongoDB
            const savedCartItems = await Promise.all(cartOrders.map(async (item) => {
                const cartItem = new CartItem({
                    link: item.link,
                    name: item.name,
                    sizes: item.sizes,
                    price: item.price,
                    color: item.color,
                    productId: item.productId,
                    quantity0: item.quantity0 || 0,
                    quantity1: item.quantity1 || 0,
                    quantity2: item.quantity2 || 0
                });
                await cartItem.save();
                return cartItem;
            }));

            // 2️⃣ Criar pedido usando os ObjectId dos CartItems
            const orderCode = Math.floor(100000 + Math.random() * 900000);

            const order = new Order({
                items: savedCartItems.map(ci => ci._id), // ✅ Array de ObjectId
                callNumber: updatedPayment.phone,
                email: updatedPayment.email,
                name: updatedPayment.name,
                status: "Recebido",
                price: updatedPayment.amount,
                payment: updatedPayment._id,
                code: orderCode
            });

            await order.save();

            // Enviar email de confirmação
            const cartDetailsHTML = generateCartDetailsHTML(cartOrders);

            const emailBody = `
                <p>Olá,</p>
                <p>Seu pagamento foi confirmado com sucesso! Abaixo estão os detalhes dos produtos:</p>
                ${cartDetailsHTML}
                <p><strong>Valor total:</strong> ${updatedPayment.amount} MZN</p>
                <p><strong>Código da encomenda:</strong> <span style="font-weight: bold; color: red;">${orderCode}</span></p>
                <p style="color: red; font-weight: bold;">Por favor, guarde este código. Ele será necessário para o levantamento da sua encomenda.</p>
                <p>Obrigado por comprar conosco!</p>
                <p>Atenciosamente,<br>ZaraMz</p>
            `;

            await axios.post(`${API_HOST}/sendConfirmationEmail`, {
                recipientEmail: updatedPayment.email,
                subject: "Confirmação de Pagamento",
                html: emailBody
            });

            console.log("\n"+emailBody+"\n");

            console.log("✅ Email de confirmação enviado para:", updatedPayment.email);
        }

        res.status(200).json({ success: true, message: "Callback processado com sucesso" });

    } catch (error) {
        console.error("Erro no callback:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno ao processar callback"
        });
    }
});


// GET /status/:reference
exports.getPaymentStatus = asyncHandler(async (req, res) => {
    try {
        const { reference } = req.params;

        if (!reference) {
            return res.status(400).json({ success: false, message: "Referência inválida." });
        }

        // Buscar pagamento pelo reference
        const payment = await Payment.findOne({ reference });

        if (!payment) {
            return res.status(404).json({ success: false, message: "Pagamento não encontrado." });
        }

        res.json({
            success: true,
            status: payment.status,
            paysuiteId: payment.paysuiteId,
            amount: payment.amount
        });

    } catch (error) {
        console.error("Erro ao consultar status do pagamento:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno ao consultar status do pagamento."
        });
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
