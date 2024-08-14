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
    sizes: {
        type: [String],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    color: {
        type: String,
    },
    productId: {
        type: String,
        required: true
    }
});
module.exports = mongoose.model("CartItem", CartItemSchema);