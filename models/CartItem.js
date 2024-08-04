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
        required: true
    },
    quantity1: {
        type: Number,
        required: true
    },
    quantity2: {
        type: Number,
        required: true
    },
    sizes: {
        type: [String],
        required: true
    }
});
module.exports = mongoose.model("CartItem", CartItemSchema);