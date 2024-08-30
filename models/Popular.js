const mongoose = require('mongoose');

const PopularSchema = new mongoose.Schema({
    ids: {
        type: [Number],
        required: true
    }
});
module.exports = mongoose.model("Popular", PopularSchema);