const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const AdminSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    numProducts: {
        type: Number
    }
});

module.exports = mongoose.model("Admin", AdminSchema);
