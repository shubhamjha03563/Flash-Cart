const router = require('express').Router();
const passport = require('passport');
const User = require('../models/User');
const LocalItem = require('../models/LocalItem');
const { addLocalCartItemsToUserCart } = require('../middlewares/updateCart');

router
  .route('/login')
  .get(async (req, res) => {
    res.render('login');
  })
  .post(
    passport.authenticate('local', {
      // successRedirect is not given because after passport redirect,
      // nothing is executed but this is not the case with normal redirect
      failureRedirect: '/auth/login',
      failureFlash: true,
    }),
    addLocalCartItemsToUserCart,
    (req, res, next) => {
      // success redirect
      res.redirect('/home');
      next();
    }
  );

router
  .route('/signup')
  .get(async (req, res, next) => {
    res.render('signup');
    next();
  })
  .post(async (req, res, next) => {
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      req.flash('isRegistered', 'You are already registered. Please login.');
      res.redirect('/auth/login');
      return;
    }
    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    process.env.newUser = 'true';
    req.flash(
      'registerSuccess',
      'Sign Up successfull. Please login with your credentials.'
    );
    res.redirect('/auth/login');
    next();
  }, addLocalCartItemsToUserCart);

// auth with google+
// This redirects the user to Google Login page
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/*
here 'passport.authenticate' is called second time - 
This time, we have the 'code' provided by google in the req query string, 
so google verifies the url and sends us back the user information
On the google auth site, we have already set the redirect url to 'auth/google/redirect' 
*/
router.get(
  '/google/redirect',
  passport.authenticate('google'),
  addLocalCartItemsToUserCart,
  (req, res, next) => {
    if (process.env.ACCOUNT_UPDATE_MESSAGE != 'none') {
      req.flash('accountUpdateMessage', process.env.ACCOUNT_UPDATE_MESSAGE);
      process.env.ACCOUNT_UPDATE_MESSAGE = 'none';
      res.redirect('/auth/login');
      return next();
    }
    res.redirect('/home');
    next();
  }
);

router.get('/logout', async (req, res, next) => {
  req.logout();
  res.redirect('/home');
  await LocalItem.deleteMany();
  next();
});

module.exports = router;
