const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const transport = require('../plugins/mailtransporter');

//Model Imports
const User = require("../models/user");

router.get('/', function(req, res){
	User.find({ superadmin: true }, function(error, result){
		if(result){
			res.render("dashboard.ejs", { user: false, data: "This is a Backend for G-Index. This has Been Already Setup. So Nothing Exists Here Afterwards. Use Your Frontend to Communicate." });
		} else {
			res.render("signup.ejs");
		}
	})
})

module.exports = router;
