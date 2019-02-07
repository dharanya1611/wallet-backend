const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const supplySchema = new Schema ({
    date:{
        type: Date,
        default: Date.now
    },
    user: {
        type: String
    },
    value: {
        type: Number
    }
})

module.exports = mongoose.model('supply', supplySchema);
