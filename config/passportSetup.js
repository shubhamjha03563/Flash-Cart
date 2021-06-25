const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const LocalStrategy = require('passport-local');
const keys = require('./keys');
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      callbackURL: '/auth/google/redirect',
      clientID: keys.google.clientID,
      clientSecret: keys.google.clientSecret,
    },
    async (accessToken, refreshToken, profile, done) => {
      let user;
      try {
        // If user is already registered but not with google and then update account with user's google data
        // Next time the user can login with google account only
        user = await User.findOne({ email: profile._json.email });
        if (user) {
          if (!user.googleId) {
            user = await User.findOneAndUpdate(
              { email: profile._json.email },
              {
                name: profile.displayName,
                googleId: profile.id,
                thumbnail: profile._json.picture,
                $unset: { password: 1 },
              },
              {
                new: true,
              }
            );
            process.env.ACCOUNT_UPDATE_MESSAGE =
              'Your account has been updated successfully. You can now login with your google account.';
          }
          return done(null, user);
        }
        user = await User.create({
          name: profile.displayName,
          email: profile._json.email,
          googleId: profile.id,
          thumbnail: profile._json.picture,
        });
      } catch (err) {
        console.log(err);
      }
      done(null, user);
    }
  )
);

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      let user;
      try {
        user = await User.findOne({ email }).select('+password');
        if (!user || user.googleId) {
          return done(null, false, {
            message:
              'Login failed. Please check your credentials or try signing in with Google.',
          });
        }

        if (await user.matchPassword(password)) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Incorrect Password' });
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  let user = await User.findById(id);
  // addLocalCartItemsToUserCart(user);
  done(null, user);
});
