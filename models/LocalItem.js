/*
  if no one has logged in put item to 'localitems' collection
  later when someone logs in, items will be added to user's cart
*/

const mongoose = require('mongoose');

const LocalItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Item',
  },
  quantity: {
    type: Number,
    default: 1,
  },
});

/*
  'localitem' or 'localItem' -> If an uppercase is provided, mongo converts it to lowercase.
  So, 'localItem' will get converted to 'localitem', thus any is fine.
  But just to be clear, I've used 'localitem'.
*/
module.exports = mongoose.model('localitem', LocalItemSchema);
