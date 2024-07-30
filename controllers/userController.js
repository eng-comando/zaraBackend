const User = require("../models/User");

const asyncHandler = require("express-async-handler");
const jwt = require('jsonwebtoken');

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