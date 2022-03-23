//jshint esversion:6

require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
//const bcrypt = require("bcrypt");
//const saltRounds = 10;

//const md5 = require('md5');
//const encrypt = require("mongoose-encryption");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(session({
  secret: "our little secret.",
  resave: false,
  saveUninitialized: false
}));



app.use(passport.initialize());
app.use(passport.session())

app.use(bodyParser.urlencoded({
  extended: true
}));

//mongodb+srv://admin-beata:<password>@cluster0.yu0at.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
//"mongodb+srv://admin-beata:mleczyk123@cluster0.yu0at.mongodb.net/todolistDB"
mongoose.connect("mongodb+srv://admin-beata:mleczyk123@cluster0.yu0at.mongodb.net/userDB", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//const secret = "Thisisourlittlesecret."
//userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser())
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://desolate-forest-24784.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://desolate-forest-24784.herokuapp.com/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/facebook',

  passport.authenticate('facebook', { scope: 'public_profile'})

);

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});


app.post("/register", function(req, res) {

  // bcrypt.hash(req.body.password, saltRounds, function(err, hash){
  //   const newUser = new User({
  //     email: req.body.username,
  //     password: hash //md5(req.body.password)
  //   })
  //
  //   newUser.save(function(err) {
  //     if (!err) {
  //       console.log("Successfully register new user")
  //       res.render("secrets");
  //     } else {
  //       console.log(err)
  //     }
  //   });

User.register({username:req.body.username}, req.body.password, function(err, user){
  if(err){
    console.log(err);
    res.redirect("/register");
  }else{
    passport.authenticate("local")(req,res, function(){
      res.redirect("/secrets")
    })
  }
})

  });



app.get("/secrets", function(req,res){
  if (req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login")
  }
})

app.post("/login", function(req, res) {
  const email = req.body.username;
  const password = req.body.password;

  // User.findOne({
  //   email: email
  // }, function(err, result) {
  //   if (err) {
  //     console.log(err)
  //   } else {
  //     if (result) {
  //       bcrypt.compare(password, result.password , function(err, response){
  //         if (result){
  //           res.render("secrets")
  //         }else{
  //           console.log("ups")
  //         }
  //       })
  //     } else {
  //       console.log("there is no such user ")
  //     }
  //   }
  //
  // })

const user = new User({
  username: email,
  password: password
})

req.login(user, function(err) {
  if (err) { return next(err); }
  return res.redirect("/secrets");
});

})

app.get("/logout", function(req,res){
  req.logout();
  res.redirect('/');
})

let port = process.env.PORT || 3000
app.listen(port, function() {
  console.log("Successfully started on port 3000. ")
})
