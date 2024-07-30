const CartItem = require("./CartItem");
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    items: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "CartItem", 
        required: true
    }],
    phoneNumber: {
        type: String,
        required: true
    },
    callNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("Order", OrderSchema);