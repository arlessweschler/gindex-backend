const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

//Model Imports
const User = require("../models/user");
const PendingUser = require("../models/pendingUser");
const SpamUser = require("../models/spamUser");
const InvitedUser = require("../models/invitedUser");

router.get('/', function(req, res){
	User.findOne({ superadmin: true }, function(error, result){
		if(result){
			res.render("dashboard.ejs", { user: false, showPass: false, data: "This is a Backend for G-Index. This has Been Already Setup. So Nothing Exists Here Afterwards. Use Your Frontend to Communicate." });
		} else {
			res.render("signup.ejs");
		}
	})
});

router.get('/generate', function(req, res){
	res.render("generate.ejs");
});

router.post('/generate', function(req, res){
	bcrypt.hash(req.body.password, 10, function(err, hashedPass){
		if(hashedPass){
			res.render("dashboard.ejs", {user: false, showPass: true, hybrid: hashedPass})
		}
	})
});

router.post('/checkmail', function(req, res){
	SpamUser.findOne({ email: req.body.email }, function(err, result){
		if(result){
			res.status(200).send({ auth: false, user: false, status: "Spammed User" })
		} else {
			PendingUser.findOne({ email: req.body.email }, function(err ,result){
				if(result){
					res.status(200).send({ auth: false, user: false, status: "Pending Confirmation from Admins." })
				} else {
					User.findOne({ email: req.body.email }, function(err, result){
						if(result){
							if(result.verified){
								res.status(200).send({ auth: true, user: true, status: "User Present & Verified" })
							} else {
								res.status(200).send({ auth: false, user:true, status: "User Present & Not Verified" })
							}
						} else {
							res.status(200).send({ auth: false, user: false, status: "User Not Present" })
						}
					})
				}
			})
		}
	})
})

module.exports = router;
