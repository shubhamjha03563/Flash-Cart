const User = require('../models/User');
const LocalItem = require('../models/LocalItem');

exports.addLocalCartItemsToUserCart = async (req, res, next) => {
  let userId;
  let localItems = await LocalItem.find({}).select('-_id');

  if (localItems.length > 0) {
    let userCartItems;
    if (process.env.NEW_USER == 'true') {
      userCartItems = await User.find()
        .sort({ $natural: -1 })
        .limit(1)
        .select({ cartItems: 1 });
      userCartItems = userCartItems[0];
      userId = userCartItems._id;
      process.env.NEW_USER = 'false';
    } else {
      userId = req.user._id;
      userCartItems = await User.findById(userId).select({
        _id: 0,
        cartItems: 1,
      });
    }
    userCartItems = userCartItems.cartItems;
    // If item not in the users cart, directly add all local items
    if (userCartItems.length == 0) {
      await User.findByIdAndUpdate(userId, {
        cartItems: localItems,
      });
      return next();
    }
    // USER CART HASHMAP
    let userCartItemsHashMap = {};
    userCartItems.forEach((item) => {
      let key = item.itemId;
      userCartItemsHashMap[key] = {
        itemId: item.itemId,
        quantity: item.quantity,
      };
    });
    // check if any localItem is already present in user's cart
    localItems.forEach((localItem) => {
      let key = localItem.itemId;
      // if localItem is present in cart then update quantity else add to cart
      if (userCartItemsHashMap[key]) {
        userCartItemsHashMap[key].quantity = localItem.quantity;
      } else {
        userCartItemsHashMap[key] = {
          itemId: localItem.itemId,
          quantity: localItem.quantity,
        };
      }
    });
    // update user's cart
    await User.findByIdAndUpdate(userId, {
      cartItems: Object.values(userCartItemsHashMap),
    });
  }
  next();
};

// exports.addLocalCartItemsToUserCart = async (req, res, next) => {
//   let localItems = await LocalItem.find({}).select('-_id');

//   if (localItems.length > 0) {
//     let userCartItems = await User.findById(req.user._id).select({
//       _id: 0,
//       cartItems: 1,
//     });
//     userCartItems = userCartItems.cartItems;
//     // If not item in the users cart, directly add all local items
//     if (userCartItems.length == 0) {
//       await User.findByIdAndUpdate(req.user.id, {
//         cartItems: localItems,
//       });
//       res.redirect('/home');
//       return next();
//     }
//     // USER CART HASHMAP
//     let userCartItemsHashMap = {};
//     userCartItems.forEach((item) => {
//       let key = item.itemId;
//       userCartItemsHashMap[key] = {
//         itemId: item.itemId,
//         quantity: item.quantity,
//       };
//     });
//     // check if any localItem is already present in user's cart
//     localItems.forEach((localItem) => {
//       let key = localItem.itemId;
//       // if localItem is present in cart then update quantity else add to cart
//       if (userCartItemsHashMap[key]) {
//         userCartItemsHashMap[key].quantity = localItem.quantity;
//       } else {
//         userCartItemsHashMap[key] = {
//           itemId: localItem.itemId,
//           quantity: localItem.quantity,
//         };
//       }
//     });
//     // update user's cart
//     await User.findByIdAndUpdate(req.user.id, {
//       cartItems: Object.values(userCartItemsHashMap),
//     });
//     res.redirect('/home');
//   }
// };
