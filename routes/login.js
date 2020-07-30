const express = require('express');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();

//Model Imports
const User = require("../models/user");
const PendingUser = require("../models/pendingUser");
const SpamUser = require("../models/spamUser");

var allowedOrigin = process.env.NODE_ENV == "production" ? process.env.FRONTENDURL : "http://localhost:8080";
var allowedHost = process.env.NODE_ENV == "production" ? process.env.SITE : "http://localhost:3000";

router.post('/', function(req, res){
	PendingUser.findOne({ email: req.body.email, post: "User" }, function(error, result){
			if(result){
				res.status(200).send({ auth: false, registered: true, token: null, message: "Your Email is Currently Pending Request. Please Wait till Accepting." });
			} else {
				SpamUser.findOne({ email: req.body.email }, function(error, result){
					if(result){
						res.status(200).send({ auth: false, registered: true, token: null, message: "You are Added to Spam List Due to Violation by a Admin. Contact Through Email for Support." });
					} else {
						User.findOne({ email: req.body.email }, function(error, result){
							if(result){
								if(req.body.password != null && result.password){
									bcrypt.compare(req.body.password, result.password, function(err, synced){
										if(synced){
											const existUser = result;
		                  let token = jwt.sign({ result }, process.env.TOKENSECRET, {expiresIn: 604800});
		                  var issueUnix = Math.floor(Date.now() / 1000)
		                  var expiryUnix = issueUnix + 604800;
		                  var expiryUnixTime = expiryUnix * 1000;
		                  var issuedUnixTime = issueUnix * 1000;
		                  const userData = {
		                    email: existUser.email,
		                    name: existUser.name,
		                    admin: existUser.admin,
		                    role: existUser.role,
		                    superadmin: existUser.superadmin,
		                    verified: existUser.verified,
		                  }
		                  res.status(200).send({ auth: true, registered: true, token: token, tokenuser:userData, issuedat: issuedUnixTime, expiryat: expiryUnixTime });
										} else {
											res.status(200).send({ auth: false, registered: true, token: null, message: "User Password is Wrong" });
										}
									})
	              } else {
	                res.status(200).send({ auth: false, registered: true, token: null, message: "Password is Null. Please Enter Your Password" });
	              }
							} else {
								res.status(200).send({auth: false, registered: false, token: null, message: "User Not Found with this Email." });
							}
						})
					}
				})
			}
		})
});

module.exports = router;
