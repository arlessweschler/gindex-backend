const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const transport = require('../plugins/mailtransporter');

//Model Imports
const User = require("../models/user");

router.post('/verify', function(req, res){
	User.findOne({ email: req.body.email }, function(error, result){
		if(result){
			jwt.verify(req.body.token, process.env.TOKENSECRET, function(error, decoded){
				if(decoded){
					var expiryUnixTime = decoded.exp * 1000;
					var issuedUnixTime = decoded.iat * 1000;
					const issueDate = new Date(issuedUnixTime).toLocaleString();
					const expiryDate = new Date(expiryUnixTime).toLocaleString();
					res.status(200).send({ auth: true, registered: true, tokenuser: decoded, issuedate: issueDate, expirydate: expiryDate });
				} else {
					res.status(200).send({auth: false, registered: false, tokenuser: null});
				}
			});
		} else {
			res.status(200).send({auth: false, registered: false, tokenuser: false});
		}
	})
})

router.post('/changepassword', function(req, res){
	User.findOne({ email: req.body.email }, function(error, result){
		if(result){
			if(bcrypt.compareSync(req.body.oldpassword, result.password)){
				var newPass = req.body.newpassword;
				User.updateOne({ email: req.body.email }, {$set: { password: bcrypt.hashSync(newPass, 10), temppassword: null }}, function(error){
					if(!error){
						res.status(200).send({ auth: true, registered: true, changed: true, message: 'Password Successfully Changed'});
					} else {
						res.status(200).send({ auth: true, registered: true, changed: false, message: 'Error While Changing password'})
					}
				})
			} else {
				res.status(200).send({ auth: true, registered: true, changed: false, message: "Paswords Do not Match with Our Records" })
			}
		} else {
			res.status(200).send({ auth: false, registered: false, changed: false, message: "Bad Request" })
		}
	})
});

router.post('/delete', function(req, res){
	User.findOne({ email: req.body.email }, function(error, result){
		if(result){
			if(result.admin){
				if(bcrypt.compareSync(req.body.pass, result.password)){
					User.deleteOne({ email: req.body.email }, function(error){
						if(error){
							res.status(200).send({ auth: true, registered: true, deleted: false, message: "Some Error Pinging the Servers. Try Again Later." });
						} else {
							const deleteMessage = {
								 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
								 to: req.body.email,
								 bcc: req.body.ADMINEMAIL,
								 replyTo: process.env.REPLYTOMAIL,         // List of recipients
								 subject: 'Account has been Deleted.', // Subject line
								 html: `<p>Your Account has been Deleted.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You.</p>` // Plain text body
							};
							transport.sendMail(deleteMessage, function(error, info){
								if(error){
									console.log(error);
								} else {
									console.log(info);
								}
							})
							res.status(200).send({ auth: true, registered: true, deleted: true, message: "Your Account has been deleted" });
						}
					})
				} else {
					res.status(200).send({ auth: false, registered: true, deleted: false, message: "Your Admin Password is Wrong" });
				}
			} else {
				res.status(200).send({ auth: false, registered: false, deleted: false, message: "You are Unauthorized" });
			}
		} else {
			res.status(200).send({ auth: false, registered: false, deleted: false, message: "BAD REQUEST" });
		}
	})
});

module.exports = router;
