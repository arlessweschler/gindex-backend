// Inititalisation
require('dotenv').config();
const express = require("express");
var ping = require('ping');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const keepAlive = require('./plugins/keepAlive');
const app = express();

keepAlive();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Allow Cross Origin Requests
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
})

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
