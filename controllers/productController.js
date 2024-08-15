const Product = require("../models/Product");
const User = require("../models/User");
const express = require("express");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { body, param, validationResult } = require('express-validator');

const secretKey = 'secret_ecom';

const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json({ errors: "Please authenticate using a valid token" });

    try {
        const data = jwt.verify(token, secretKey);
        req.user = data.user;
        next();
    } catch (error) {
        res.status(401).json({ errors: "Invalid token" });
    }
};

const validateProduct = [
    body('name').isString().notEmpty(),
    body('images').isArray(),
    body('category').isString().notEmpty(),
    body('type').isString().notEmpty(),
    body('description').isString().optional(),
    body('color').isString().optional(),
    body('new_price').isNumeric(),
    body('old_price').isNumeric(),
    body('sizes').isArray().optional(),
    body('link').isString().optional()
];

const validateId = [
    param('productId').isMongoId()
];

const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

exports.init = asyncHandler(async (req, res, next) => {
    res.send("Express App is Running");
});

exports.addProduct = [fetchUser, validateProduct, checkValidation, asyncHandler(async (req, res, next) => {
    let products = await Product.find({});
    let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

    const product = new Product({
        id,
        name: req.body.name,
        images: req.body.images,
        category: req.body.category,
        type: req.body.type,
        description: req.body.description,
        color: req.body.color,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
        sizes: req.body.sizes,
        link: req.body.link,
    });

    await product.save();
    res.json({ success: true, name: req.body.name });
})];

exports.removeProduct = [fetchUser, asyncHandler(async (req, res, next) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ errors: "Product ID is required" });

    await Product.findOneAndDelete({ id });
    res.json({ success: true });
})];

exports.allProducts = asyncHandler(async (req, res, next) => {
    const products = await Product.find({});
    res.json(products);
});

exports.newCollections = asyncHandler(async (req, res, next) => {
    const products = await Product.find({});
    const newCollection = products.slice(-8);
    res.json(newCollection);
});

exports.popularInWomen = asyncHandler(async (req, res, next) => {
    const products = await Product.find({ category: "women" });
    const popularWomen = products.slice(0, 4);
    res.json(popularWomen);
});

exports.relatedProducts = asyncHandler(async (req, res, next) => {
    const { category } = req.body;
    if (!category) return res.status(400).json({ errors: "Category is required" });

    const products = await Product.find({ category });
    const relatedProducts = products.slice(0, 4);
    res.json(relatedProducts);
});

exports.addToCart = [fetchUser, asyncHandler(async (req, res, next) => {
    const { itemId, quantityField, name, image, price, link, size, color, productId } = req.body;

    if (!itemId || !quantityField) return res.status(400).json({ errors: "Item ID and quantity field are required" });

    const userData = await User.findById(req.user.id);
    if (!userData) return res.status(404).json({ errors: "User not found" });

    const item = userData.cartData[itemId] || {};
    item[quantityField] = (item[quantityField] || 0) + 1;
    item.name = name;
    item.image = image;
    item.price = price;
    item.link = link;
    item.sizes = item.sizes || [];
    item.sizes.push(size);
    item.color = color;
    item.productId = productId;

    userData.cartData[itemId] = item;
    await User.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });

    res.json({ success: "Item added to cart" });
})];

exports.removeFromCart = [fetchUser, asyncHandler(async (req, res, next) => {
    const { itemId, quantityField } = req.body;

    if (!itemId || !quantityField) return res.status(400).json({ errors: "Item ID and quantity field are required" });

    const userData = await User.findById(req.user.id);
    if (!userData) return res.status(404).json({ errors: "User not found" });

    const item = userData.cartData[itemId];
    if (!item) return res.status(404).json({ errors: "Item not found in cart" });

    if (item[quantityField] > 0) {
        item[quantityField] -= 1;
        item.sizes.pop();
        await User.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });
        res.json({ success: "Item quantity updated" });
    } else {
        delete userData.cartData[itemId];
        await User.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });
        res.json({ success: "Item removed from cart" });
    }
})];

exports.getCart = [fetchUser, asyncHandler(async (req, res, next) => {
    const userData = await User.findById(req.user.id);
    res.json(userData.cartData);
})];

exports.getProductDetails = [param('productId').isMongoId(), checkValidation, asyncHandler(async (req, res, next) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json(product);
})];

exports.updateProduct = [param('productId').isMongoId(), checkValidation, asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const updatedData = req.body;

    const product = await Product.findByIdAndUpdate(productId, updatedData, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json(product);
})];

exports.deleteProduct = [param('productId').isMongoId(), checkValidation, asyncHandler(async (req, res, next) => {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product deleted successfully' });
})];
