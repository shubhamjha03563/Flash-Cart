const router = require('express').Router();
const fs = require('fs');
const Item = require('../models/Item');
const LocalItem = require('../models/LocalItem');
const User = require('../models/User');

router.get('/', async (req, res, next) => {
  let items = await Item.find();

  let itemsHashMap = {},
    cartItems = [],
    totalPrice = 0,
    numOfUserCartItems = 0;

  let localCartItems = await LocalItem.find({}).select('-_id');

  if (req.user) {
    numOfUserCartItems = req.user.cartItems.length;
  }

  if (numOfUserCartItems > 0 || localCartItems.length > 0) {
    items.forEach((item) => {
      let key = item._id;
      itemsHashMap[key] = {
        name: item.name,
        imgName: item.imgName,
        price: item.price,
      };
    });

    if (req.user) {
      req.user.cartItems.forEach((item) => {
        let newIndexPlus1 = cartItems.push(itemsHashMap[item.itemId]);
        // 'array.push' adds new item to array and returns newItem's index + 1
        cartItems[newIndexPlus1 - 1].quantity = item.quantity;
        totalPrice += cartItems[newIndexPlus1 - 1].price * item.quantity;
      });
    } else {
      localCartItems.forEach((item) => {
        let newIndexPlus1 = cartItems.push(itemsHashMap[item.itemId]);
        cartItems[newIndexPlus1 - 1].quantity = item.quantity;
        totalPrice += cartItems[newIndexPlus1 - 1].price * item.quantity;
      });
    }
  }
  res.render('home', { items, cartItems, totalPrice, user: req.user });
  next();
});

// add item to cart
router.get('/:itemName/addToCart', async (req, res, next) => {
  let item = await Item.findOne({ name: req.params.itemName });
  if (!item) {
    return next(new Error(`Item not found with name: ${req.params.itemName}`));
  }
  // if no one has logged in, put item to localItem
  // later when someone logs in, items will be added to user's cart
  if (!req.user) {
    await LocalItem.create({ itemId: item._id }); // quantity is by default 1
  } else {
    await User.findByIdAndUpdate(req.user.id, {
      $push: { cartItems: { itemId: item._id } },
    });
  }

  res.json(item);
});

// remove item from cart
router.get('/:itemName/removeFromCart', async (req, res, next) => {
  let item = await Item.findOne({ name: req.params.itemName }).select('_id');
  if (!item) {
    return next(new Error(`Item not found with name: ${req.params.itemName}`));
  }
  if (!req.user) {
    await LocalItem.findOneAndDelete({ itemId: item._id });
  } else {
    await User.findOneAndUpdate(
      { name: req.user.name },
      { $pull: { cartItems: { itemId: item._id } } }
    );
  }
  res.json(item);
});

// quantity changed
router.get('/:itemName/:quantity', async (req, res, next) => {
  let quantity = req.params.quantity,
    itemName = req.params.itemName;

  let item = await Item.findOne({ name: itemName }).select('_id');
  if (!item) {
    return next(new Error(`Item not found with name: ${req.params.itemName}`));
  }

  let itemId = item._id;
  if (!req.user) {
    item = await LocalItem.findOneAndUpdate({ itemId }, { quantity });
  } else {
    item = await User.findOneAndUpdate(
      { _id: req.user._id, 'cartItems.itemId': itemId },
      { $set: { 'cartItems.$.quantity': quantity } }
    );
  }

  res.json({ item });
});

router.get('/purchase', async (req, res, next) => {
  if (req.user) {
    await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: { cartItems: [] } }
    );
    res.json({ login: true });
  } else {
    res.json({ login: false });
  }
});

module.exports = router;
