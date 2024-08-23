const Product = require("../models/Product");
const User = require("../models/User");
const express = require("express");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require('express-validator');

//const SECRET_KEY = process.env.SECRET_KEY || "chidumanhane";
const SECRET_KEY = "chidumanhane";

exports.init = asyncHandler(async (req, res, next) => {
    res.send("Express App is Running");
});

const fetchUser = async (req, res, next) => {
    try {
        const token = req.header('auth-token');

        if (!token) {
            return res.status(401).json({ errors: "Please authenticate using a valid token" });
        }

        const data = jwt.verify(token, 'secret_ecom');
        req.user = data.user;
        next();
    } catch (error) {
        return res.status(401).json({ errors: "Invalid token", message: error.message });
    }
};


const authAdmin = (req, res, next) => {
    try {
        const token = req.header("Authorization").replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ message: "Acesso negado" });
        }

        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: "Token inválido" });
    }
};

exports.verifyToken = [authAdmin, asyncHandler(async (req, res) => {
    try {
        res.json({ message: "Token valid" });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying token', error });
    }
})];

exports.addproduct = [authAdmin, 
    body('name').notEmpty().withMessage('Name is required'),
    body('images').isArray().withMessage('Images must be an array'),
    body('category').notEmpty().withMessage('Category is required'),
    body('type').notEmpty().withMessage('Type is required'),
    body('new_price').notEmpty().withMessage('New price is required'),
    body('sizes').notEmpty().withMessage('Sizes is required'),
    body('link').notEmpty().withMessage('Link is required'),

    asyncHandler(async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const product = new Product({
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
        } catch (error) {
            res.status(500).json({ message: 'Error adding product', error });
        }
    })
];

exports.removeproduct = [authAdmin, asyncHandler(async (req, res) => {
    try {
        const { id } = req.body;
        const result = await Product.findOneAndDelete({ id });
        if (!result) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ success: true, name: req.body.name });
    } catch (error) {
        res.status(500).json({ message: 'Error removing product', error });
    }
})];

exports.deleteProduct = [authAdmin, asyncHandler(async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findByIdAndDelete(productId);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
})];

exports.updateProduct = [authAdmin, asyncHandler(async (req, res) => {
    try {
        const { productId } = req.params;
        const updatedData = req.body;
        const product = await Product.findByIdAndUpdate(productId, updatedData, { new: true });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error });
    }
})];

exports.allproducts = asyncHandler(async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all products', error });
    }
});

exports.newcollections = asyncHandler(async (req, res) => {
    try {
        const products = await Product.find({});
        const newcollection = products.slice(-8);
        res.json(newcollection);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching new collections', error });
    }
});

exports.popularinwomen = asyncHandler(async (req, res) => {
    try {
        const products = await Product.find({ category: "women" });
        const popularwomen = products.slice(0, 4);
        res.json(popularwomen);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching popular women products', error });
    }
});

exports.relatedproducts = asyncHandler(async (req, res) => {
    try {
        const products = await Product.find({ category: req.body.category });
        const relatedProducts = products.slice(0, 4);
        res.json(relatedProducts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching related products', error });
    }
});

exports.addtocart = [fetchUser, asyncHandler(async (req, res) => {
    try {
        const userData = await User.findById(req.user.id);
        if (!userData) {
            return res.status(404).send('User not found');
        }

        const itemId = req.body.itemId;
        const item = userData.cartData[itemId] || {};

        item.name = req.body.name;
        item.image = req.body.image;
        item.price = req.body.price;
        item[req.body.quantityField] = (item[req.body.quantityField] || 0) + 1;
        item.link = req.body.link;
        item.sizes = item.sizes || [];
        item.sizes.push(req.body.size);
        item.color = req.body.color;
        item.productId = req.body.productId;

        userData.cartData[itemId] = item;
        await User.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });

        res.send("Added to cart");
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
})];

exports.removefromcart = [fetchUser, asyncHandler(async (req, res) => {
    try {
        const userData = await User.findById(req.user.id);
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }

        const { itemId, quantityField } = req.body;

        if (!userData.cartData[itemId]) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        if (userData.cartData[itemId][quantityField] > 0) {
            userData.cartData[itemId][quantityField] -= 1;
            userData.cartData[itemId].sizes.pop();
            await User.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });
            res.send("Removed from cart");
        } else {
            userData.cartData[itemId] = {
                name: "",
                image: "",
                price: 0,
                link: "",
                sizes: [],
                color: ""
            };
            await User.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });
            res.send("Item reset");
        }
    } catch (error) {
        res.status(500).json({ message: 'Error processing request', error });
    }
})];

exports.getcart = [fetchUser, asyncHandler(async (req, res, next) => {
    try {
        console.log("GetCart");
        const userData = await User.findOne({ _id: req.user.id });
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(userData.cartData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart data', error });
    }
})];

exports.getProductDetails = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error });
    }
};