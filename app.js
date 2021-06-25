const express = require('express');
const dotenv = require('dotenv');
const app = express();
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const flash = require('express-flash');
const passportSetup = require('./config/passportSetup');
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const keys = require('./config/keys');
const passport = require('passport');
const LocalItem = require('./models/LocalItem');

dotenv.config({ path: './config/.env' });

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cookieSession({
    maxAge: process.env.COOKIE_EXPIRE,
    keys: [keys.session.key],
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

mongoose.connect(keys.mongo.URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

// set view engine
app.set('view engine', 'ejs');

// mount routers
app.get('/', (req, res, next) => {
  res.redirect('/home');
  next();
});
app.use('/home', homeRoutes);
app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
  console.log(err);
  res.json({ error: err.message });
  next();
});

app.listen(process.env.PORT, async () => {
  try {
    await LocalItem.deleteMany();
  } catch (err) {
    console.log(err);
  }
  console.log('app now listening for requests on port 3000');
});
