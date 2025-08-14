const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paysuiteId: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  reference: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  checkoutUrl: {
    type: String,
  },
  phone: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "failed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  confirmedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
