const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paysuiteId: {      
    type: String,
    required: true,
    unique: true,
  },
  reference: {     
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: { 
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  checkoutUrl: {  
    type: String,
  },
  phone: {        
    type: String,
  },
  email: {        
    type: String,
  },
  name: {            
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  cartItems: {     
    type: Array,
    default: []
  },
  deliveryOption: {            
    type: String,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
