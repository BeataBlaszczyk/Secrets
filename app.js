//jshint esversion:6


const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const encrypt = require("mongoose-encryption");


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const secret = "Thisisourlittlesecret."
userSchema.plugin(encrypt, {secret:secret, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

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

  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  })

  newUser.save(function(err) {
    if (!err) {
      console.log("Successfully register new user")
      res.render("secrets");
    } else {
      console.log(err)
    }
  });

});

app.post("/login", function(req, res) {
  const email = req.body.username;
  const password = req.body.password;
  console.log(email + password)
  User.findOne({
    email: email
  }, function(err, result) {
    if (err) {
      console.log(err)
    } else {
      if (result) {
        if (result.password === password) {
          res.render("secrets");
        } else {
          console.log("ups. smth went wrong")
        }
      } else {
        console.log("there is no such user ")
      }
    }

  })

})


app.listen(3000, function() {
  console.log("Successfully started on port 3000. ")
})
