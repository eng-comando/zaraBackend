const User = require("../models/User");
const Admin = require("../models/Admin");

const asyncHandler = require("express-async-handler");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;
const EMAIL = process.env.EMAIL;
const HOST = process.env.HOST;
const PASSWORD = process.env.PASSWORD;

const transporter = nodemailer.createTransport({
    host: HOST, 
    port: 587, 
    secure: false, 
    auth: {
      user: EMAIL, 
      pass: PASSWORD
    }
});

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000);
};
const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const isLengthValid = password.length >= 8;
    
    return hasUpperCase && hasNumber && isLengthValid;
};

exports.signup = asyncHandler(async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!validatePassword(password)) {
            return res.status(400).json({ success: false, error: 'A senha deve ter pelo menos um número, uma letra maiúscula e 8 caracteres no mínimo' });
        }

        let user = await User.findOne({ email });

        if (user) {
            if (!user.isVerified) {
                const newVerificationCode = generateVerificationCode();

                user.verificationCode = newVerificationCode;
                await user.save();

                const mailOptions = {
                    from: EMAIL,
                    to: email,
                    subject: "Código de Verificação",
                    html: `
                        <p>Olá, ${username}!</p>
                        <p>Bem-vindo à ZaraMz. Para avançar com o registro da sua conta, por favor, confirme seu e-mail com o código abaixo:</p>
                        <p><b>${newVerificationCode}</b></p>
                        <p>Até já,</p>
                        <p>A equipe ZaraMz</p>
                    `,
                };

                try {
                    await transporter.sendMail(mailOptions);
                } catch (emailError) {
                    console.error('Erro ao reenviar e-mail de verificação:', emailError);
                    return res.status(500).json({ success: false, error: 'Erro ao reenviar e-mail de verificação' });
                }

                return res.status(200).json({ success: true, message: "Usuário já existente, mas não verificado. Verifique seu e-mail com o novo código de verificação." });
            } else {
                return res.status(400).json({ success: false, error: "Usuário já existe com o mesmo e-mail" });
            }
        }

        let cart = {};
        for (let i = 0; i < 300; i++) {
            cart[i] = {
                name: "",
                image: "",
                price: 0,
                quantity: 0,
                link: "",
                sizes: []
            };
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationCode = generateVerificationCode();

        user = new User({
            name: username,
            email,
            phoneNumber: "",
            password: hashedPassword,
            cartData: cart,
            isVerified: false,
            verificationCode 
        });

        await user.save();

        const mailOptions = {
            from: EMAIL,
            to: email,
            subject: "Código de Verificação",
            html: `
                <p>Olá, ${username}!</p>
                <p>Bem-vindo à ZaraMz. Para avançar com o registro da sua conta, por favor, confirme seu e-mail com o código abaixo:</p>
                <p><b>${verificationCode}</b></p>
                <p>Até já,</p>
                <p>A equipe ZaraMz</p>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Erro ao enviar e-mail de verificação:', emailError);
            return res.status(500).json({ success: false, error: 'Erro ao enviar e-mail de verificação' });
        }

        res.status(201).json({ success: true, message: "Verifique seu e-mail para o código de verificação." });

    } catch (error) {
        console.error('Erro no signup:', error);
        res.status(500).json({ success: false, message: "Erro no servidor", error: error.message });
    }
});

exports.verifyCode = asyncHandler(async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user || Number(user.verificationCode) !== Number(verificationCode)) {
            return res.status(400).json({ success: false, error: "Código de verificação inválido." });
        }
        
        user.isVerified = true;
        user.verificationCode = undefined;
        await user.save();

        const data = {
            user: {
                id: user.id
            }
        };
        const token = jwt.sign(data, process.env.SECRET_KEY, { expiresIn: '6h' });

        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error('Erro na verificação do código:', error);
        res.status(500).json({ success: false, message: "Erro no servidor", error: error.message });
    }
});


exports.login = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, error: "Usuário não encontrado" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: "Senha incorreta" });
        }

        const data = {
            user:{
                id:user.id
            }
        }
        const token = jwt.sign(data, SECRET_KEY, { expiresIn: '6h' });

        res.json({ success: true, token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

exports.loginAdmin = asyncHandler(async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(400).json({ message: "Usuário não encontrado" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Senha incorreta" });
        }

        const token = jwt.sign({ id: admin._id, username: admin.username }, SECRET_KEY, {
            expiresIn: "6h",
        });

        res.json({ token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro no servidor" });
    }
});

/*
exports.signupAdmin = asyncHandler(async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingAdmin = await Admin.findOne({ username });

        if (existingAdmin) {
            return res.status(400).json({ message: "Usuário já existe" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new Admin({
            username,
            password: hashedPassword,
        });

        await newAdmin.save();

        res.status(201).json({ message: "Administrador criado com sucesso" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro no servidor" });
    }
});
*/
