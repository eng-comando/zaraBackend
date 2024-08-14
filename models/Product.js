const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ProductSchema = new Schema({
    id:{
        type: Number,
        required: true,
    },
    name:{
        type:String,
        require:true,
    },
    images: {
        type: [String],
        required: true,
    },
    category:{
        type:String,
        required:true,
    },
    type:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    color: {
        type:String,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true
    },
    sizes: {
        type: [String],
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("Product", ProductSchema);
