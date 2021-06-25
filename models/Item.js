const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: String,
  price: Number,
  imgName: String,
});

module.exports = mongoose.model('item', ItemSchema);
