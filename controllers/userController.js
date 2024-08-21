const User = require("../models/User");
const Admin = require("../models/Admin");

const asyncHandler = require("express-async-handler");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");


const SECRET_KEY = "chidumanhane"; 

exports.signup = asyncHandler(async (req, res, next) => {
    let check = await User.findOne({email:req.body.email});

    if(check) {
        return res.status(400).json({sucess:false, error:"Existing user found with same email"});
    }

    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = {
            name: "",
            image: "",
            price: 0,   
            quantity: 0,   
            link: "",
            sizes:[]
        };
    }

    const user = new User({
        name:req.body.username,
        email:req.body.email,
        phoneNumber:"",
        password:req.body.password,
        cartData:cart,
    });

    await user.save();
    
    const data = {
        user:{
            id:user.id
        }
    }

    const token = jwt.sign(data,'secret_ecom');
    res.json({success:true, token});
});


exports.login = asyncHandler(async (req, res, next) => {
    let user = await User.findOne({email:req.body.email});

    if(user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            
            res.json({success:true, token});
        } else {
            res.json({success:false, errors:"Wrong Password"});
        }
    } else {
        res.json({success:false, errors:"Wrong Email Id"});
    }
});


exports.loginAdmin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(400).json({ message: "Usuário não encontrado" });
        }
        console.log(admin.password);
        console.log(password);
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
    const { username, password } = req.body;

    try {
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
