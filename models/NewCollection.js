const mongoose = require('mongoose');

const NewCollectionSchema = new mongoose.Schema({
    ids: {
        type: [Number],
        required: true
    }
});
module.exports = mongoose.model("NewCollection", NewCollectionSchema);