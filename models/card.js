const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const cardSchema = new Schema({
  address: String,
  data:String,
  status: String,
  cardNumber: Number,
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type:Schema.Types.ObjectId, ref: 'User'
  }
});

module.exports = mongoose.model('cards',cardSchema)