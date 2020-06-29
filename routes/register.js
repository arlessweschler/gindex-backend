const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const transport = require('../plugins/mailtransporter');
const randomstring = require('randomstring');

//Model Imports
const User = require("../models/user");
const PendingUser = require("../models/pendingUser");
const SpamUser = require("../models/spamUser");
const InvitedUser = require("../models/invitedUser");

var allowedOrigin = process.env.NODE_ENV == "production" ? process.env.FRONTENDURL : "http://localhost:8080";

router.post('/user', function(req, res){
	if(req.headers.origin == allowedOrigin){
		User.findOne({ email: req.body.adminuseremail }, function(error, result){
			if(result){
					if(result.admin){
						if(bcrypt.compareSync(req.body.adminpass, result.password)){
							PendingUser.findOne({ email: req.body.email }, function(pendingUser, pendingResult){
								if(pendingResult){
									User.findOne({ email: req.body.email }, function(error, result){
										if(result){
											res.status(200).send({ auth: false, registered: true, message: "User Already Exists with this Email" });
										} else if(!result) {
											var temporaryPass = randomstring.generate({ length: 8, charset: 'alphanumeric' });
											const newUser = new User({
												name: req.body.name,
												email: req.body.email,
												registeredDate: Date.now(),
												temppassword: bcrypt.hashSync(temporaryPass, 10),
												role: "User",
												admin: false,
												superadmin: false,
												verified: false,
											})
											 newUser.save(function(error, doc){
												 if(!error){
												 	const message = {
												     from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
												     to: req.body.email,
														 replyTo: process.env.REPLYTOMAIL,
												     subject: 'We Have Accepted Your Request.', // Subject line
												     html: `<b>As Per Your Request We have Registered you in Our Website</b><p>Now You can Login with Your Email</p><p>Here is Your One Time Password - <b>${temporaryPass}</b></p><p>One Time Password is Valid for only 3 Hours</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
												 	};
													PendingUser.deleteOne({ email: req.body.email }, function(pendingError){
														if(!pendingError){
															transport.sendMail(message, function(err, info) {
																	if (err) {
																		User.deleteOne({ email: req.body.email}, function(error){
																			if(error){
																				console.log(error);
																			} else {
																				SpamUser.findOne({ email: req.body.email }, function(spamError, spamResult){
																					if(spamResult){
																						console.log(spamResult);
																					} else {
																						const newSpamUser = new SpamUser({
																							name: req.body.name,
																							email: req.body.email,
																							reason: "His Email Looks Like a Spam",
																							flaggedby: req.body.adminuseremail
																						})
																						newSpamUser.save(function(error, doc){
																							if(!error){
																								console.log(error)
																							} else {
																								console.log(error);
																							}
																						})
																					}
																				});
																				const adminMessage = {
																					 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
																					 to: req.body.adminuseremail,
																					 replyTo: process.env.REPLYTOMAIL,         // List of recipients
																					 subject: 'Don\'t Add Spam users', // Subject line
																					 html: `<b>The Recipient You added now is a Spam.</b><p>You have been Restricted from Registering new Users for one Day.</p><p>If you think this the Recipient is Not a Spam Email, Reply to this mail to Remove redtriction on your Account</p>` // Plain text body
																				};
																				console.log(adminMessage);
																				transport.sendMail(adminMessage, function(error, info){
																					if(error){
																						console.log(error);
																					} else {
																						console.log(error);
																					}
																				})
																				res.status(200).send({ auth: false, registered: false, message: "It Looks like the Recipient Mail is Spam." })
																			}
																		});
																	} else {
																		res.status(200).send({ auth: true, registered: true, message: 'User Successfully Registered.One Time Password has been sent to Recipient Mail that is Valid for 3 hours. In case the Recipient Did\'t Signup within this Period. Their Account will be Automatically Deleted.'});
																	}
															});
														} else {
															res.status(200).send({ auth: true, registered: false, message: 'Error While Moving User Database Record. Please Try Again Later.' })
														}
													})
												 } else {
													 res.status(200).send({ auth: true, registered: false, message: "Error Saving User" });
													 console.log(error);
												 }
											 });
										}
									})
								} else {
									res.status(200).send({ auth: false, registered: true, message: "A User has to Request in Order for Being Added. This is To Ensure that a User is a Human and Not a Spam Bot. Also to Control Admins Adding Multiple Users." });
								}
							})
						} else {
								res.status(200).send({ auth: false, registered: true, message: "Your Admin Password does Not Match with our Records" })
						}
					} else {
						res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
					}
			} else {
				res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
			}
		})
	} else {
		res.status(200).send({auth: false, message: "Unauthorized"});
	}
});

router.post('/rootuser', function(req, res){
	User.findOne({ $or: [ { email: req.body.email }, { superadmin: true } ] }, function(error, result){
		if(result){
			res.render("dashboard.ejs", {user:false, data: "SuperAdmin Already Exists. You Cannot Proceed Here afterwards. Continue Through Your Frontend"})
		} else {
			if(process.env.SITE_SECRET == req.body.secret){
				const newRootUser = new User({
					name: req.body.name,
					email: req.body.email,
					temppassword: null,
					registeredDate: Date.now(),
					password: bcrypt.hashSync(req.body.password, 10),
					role: "Super Admin",
					admin: true,
					superadmin: true,
					verified: true,
				})
				newRootUser.save(function(error, doc){
					if(!error){
						res.render("dashboard.ejs", {user:true, details: newRootUser, fronturl: process.env.FRONTENDURL})
					} else {
						res.render("dashboard.ejs", {user:false, data: "There's an Error While Saving your Details. Please Try Again."})
					}
				})
			} else {
				res.render("dashboard.ejs", {user:false, data: "Your Secret Doesn't Match."})
			}
		}
	})
})

router.use('/approve', require('./approve'));

module.exports = router;
