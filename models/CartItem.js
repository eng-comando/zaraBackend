const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    link: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity0: {
        type: Number,
    },
    quantity1: {
        type: Number,
    },
    quantity2: {
        type: Number,
    },
    sizes: {
        type: [String],
        required: true
    },
    price: {
        type: Number,
        required: true
    }
});
module.exports = mongoose.model("CartItem", CartItemSchema);