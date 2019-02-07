const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const couponSchema = new Schema({
    date:{
        type:Date,
        default:new Date
    },
    active: {
        type:String,
        default: 'y'
    },
    symbol: String,
    name: String,
    description: String,
    totalSupply: Number,
    txnno: String,
    abi: String,
    bytecode: String,
    address: String,
    owner: String
})

module.exports = mongoose.model('Coupon', couponSchema);