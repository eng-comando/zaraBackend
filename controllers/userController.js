const User = require("../models/User");
const Admin = require("../models/Admin");

const asyncHandler = require("express-async-handler");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;

exports.signup = asyncHandler(async (req, res) => {

    try {
        const { username, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, error: "User already exists with the same email" });
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

        user = new User({
            name: username,
            email,
            phoneNumber: "",
            password: hashedPassword,
            cartData: cart,
        });

        await user.save();

        const data = {
            user:{
                id:user.id
            }
        }
        const token = jwt.sign(data, SECRET_KEY, { expiresIn: '6h' });

        res.status(201).json({ success: true, token });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

exports.login = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, error: "Invalid email or password" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: "Invalid email or password" });
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
