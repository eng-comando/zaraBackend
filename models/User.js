const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const UserSchema = new Schema({
    name: {
        type:String,
        required: true,
    },
    email: {
        type:String,
        unique:true,
    },
    phoneNumber: {
        type: String,
    },
    password: {
        type:String,
    },
    cartData: {
        type:Object,
        default: {},
    },
    date:{
        type: Date,
        default:Date.now,
    },
});

module.exports = mongoose.model("User", UserSchema);
