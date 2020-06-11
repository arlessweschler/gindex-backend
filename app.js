const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
app.use(bodyParser.urlencoded({
	extended: true
}));

mongoose.connect(process.env.DBURL, {useNewUrlParser: true,  useUnifiedTopology: true})

const site = process.env.SITE;

function keepalive() {
  if (site) {
    setInterval(async () => {
      const data = await axios(`https://ping-pong-sn.herokuapp.com/pingback?link=${site}`);
      console.log("keep alive triggred, status: ", data.status);
    }, 1560000);
  } else {
    console.warn("Set site env var. Read docs at https://github.com/patheticGeek/torrent-aio-bot");
  }
}

keepalive();

const userSchema = {
  name: String,
  email: String,
	password: String
};

const User = mongoose.model("User", userSchema);

app.get('/', function(req, res){
  res.send("This is a DB SIte")
})

app.post('/login', function(req, res){
  User.findOne({ email: req.body.email }, function(error, result){
    if(!error){
      let passwordIsValid = bcrypt.compareSync(req.body.password, result.password);
      console.log(passwordIsValid);
      if(passwordIsValid){
        const existUser = result;
        let token = jwt.sign({ id: existUser._id }, "ThisiasdiasdiasdilongnaonognongongongonPapsaspsowed", {expiresIn: 86400});
        console.log(token);
        res.status(200).send({ auth: true, token: token, user: existUser });
      } else {
        res.status(401).send({ auth: false, token: null });
      }
    } else {
      res.status(200).send({auth: false, token: null });
    }
  })
})

app.post('/register', function(req, res){
  User.findOne({ email: req.body.email }, function(error, result){
    if(result){
      res.send(result);
      console.log("result");
    } else if(!result) {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8)
      })
       console.log(newUser)
       newUser.save(function(error, doc){
         if(!error){
           let token = jwt.sign({ id: newUser._id }, "ThisiasdiasdiasdilongnaonognongongongonPapsaspsowed", {expiresIn: 86400});
           console.log(token);
           res.status(200).send({ auth: true, token: token, user: doc });
         } else {
           res.status(200).send({ auth: false, token: null });
         }
       });
    }
  })
})

app.listen(process.env.PORT || 3000, function () {
	console.log("Server is Running");
})
