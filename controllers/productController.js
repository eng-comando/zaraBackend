const Product = require("../models/Product");
const User = require("../models/User"); 
const express = require("express");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

exports.init = asyncHandler(async (req, res, next) => {
    res.send("Express App is Running");
});

exports.addproduct = asyncHandler(async (req, res, next) => {
    let products = await Product.find({});
    let id = 1;

    if(products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];

        id = last_product.id + 1;
    }

    const product = new Product({
        id:id,
        name:req.body.name,
        images:req.body.images,
        category:req.body.category,
        type:req.body.type,
        description:req.body.description,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
        sizes:req.body.sizes,
        link:req.body.link,
    });
    await product.save();
    console.log("Saved");

    res.json({
        success:true,
        name:req.body.name,
    });
});

exports.removeproduct = asyncHandler(async (req, res, next) => {
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name
    });
});

exports.allproducts = asyncHandler(async (req, res, next) => {
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
});

exports.newcollections = asyncHandler(async (req, res, next) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    res.send(newcollection);
});

exports.popularinwomen = asyncHandler(async (req, res, next) => {
    let products = await Product.find({category:"women"});
    let popularwomen = products.slice(0,4);
    res.send(popularwomen);
});
exports.relatedproducts = asyncHandler(async (req, res, next) => {
    let products = await Product.find({category:req.body.category});
    let relatedProducts = products.slice(0,4);
    res.send(relatedProducts);
});

const fetchUser = async ( req, res, next) => {
    const token = req.header('auth-token');

    if(!token) {
        res.status(401).send({errors:"Please authenticate using valid token"})
    } else {
        try {
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();
        } catch(error) {
            res.status(401).send({errors:"Please authenticate using valid token"});
        }
    }
}
exports.addtocart = [fetchUser, asyncHandler(async (req, res, next) => {
    console.log("adicionado", req.body.itemId);
    let userData = await User.findOne({_id:req.user.id});

    userData.cartData[req.body.itemId].name = req.body.name;
    userData.cartData[req.body.itemId].image = req.body.image;
    userData.cartData[req.body.itemId].price += req.body.price;
    userData.cartData[req.body.itemId][req.body.quantityField] += 1;
    userData.cartData[req.body.itemId].link = req.body.link;
    userData.cartData[req.body.itemId].sizes.push(req.body.size);

    await User.findOneAndUpdate({_id:req.user.id}, {cartData:userData.cartData});
    res.send("Added");
})];

exports.removefromcart = [fetchUser, asyncHandler(async (req, res, next) => {
    console.log("removed", req.body.itemId);
    let userData = await User.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId].quantity > 0) {
        userData.cartData[req.body.itemId][req.body.quantityField] -= 1;
        userData.cartData[req.body.itemId].sizes.pop();
        await User.findOneAndUpdate({_id:req.user.id}, {cartData:userData.cartData});
        res.send("Removed");
    } else {
        userData.cartData[req.body.itemId].name = "";
        userData.cartData[req.body.itemId].image = "";
        userData.cartData[req.body.itemId].price = 0;
        userData.cartData[req.body.itemId].link = "";
        userData.cartData[req.body.itemId].sizes = [];
        await User.findOneAndUpdate({_id:req.user.id}, {cartData:userData.cartData});
        res.send("Reseted");
    }
})];

exports.getcart = [fetchUser, asyncHandler(async (req, res, next) => {
    console.log("GetCart");
    let userData = await User.findOne({_id:req.user.id});
    res.json(userData.cartData);
})];

