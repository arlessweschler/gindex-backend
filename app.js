// Inititalisation
require('dotenv').config();
const express = require("express");
var ping = require('ping');
const cors = require('cors');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const keepAlive = require("./plugins/keepAlive");
const deletePlugin = require('./plugins/deleteAll');
const app = express();

deletePlugin();
keepAlive();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var whitelist = process.env.FRONTENDURL.split(",");
console.log(whitelist);
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

//Cross Origin Requests
app.use(cors(corsOptions));

mongoose.connect(process.env.DBURL, {useNewUrlParser: true,  useUnifiedTopology: true, useCreateIndex: true})
//Routes
app.use('/', require('./routes/index'));
app.use('/login', require('./routes/login'));
app.use('/ping', require('./routes/ping'));
app.use('/request', require('./routes/request'));
app.use('/user', require('./routes/user'));
app.use('/register', require('./routes/register'));
app.use('/invite', require('./routes/invite'));
app.use('/delete', require('./routes/delete'));
app.use('/get', require('./routes/get'))
app.use('/spam', require('./routes/spam'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log('Server Started on ' + PORT ));
