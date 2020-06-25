// Inititalisation
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

const app = express();
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());

// Allow Cross Origin Requests
const allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
}

app.use(allowCrossDomain)

mongoose.connect(process.env.DBURL, {useNewUrlParser: true,  useUnifiedTopology: true, useCreateIndex: true})

// Keep Site Online By Pinging every 25 Minutes.
const site = process.env.SITE;
function keepalive() {
  if (site) {
    setInterval(async () => {
      const data = await axios(`https://ping-pong-sn.herokuapp.com/pingback?link=${site}`);
      console.log("keep alive triggred, status: ", data.status);
    }, 1560000);
  } else {
    console.warn("Set site env var");
  }
}
keepalive();

// User Database Model
const userSchema = {
  name: { type: String, required: true },
  email: { type: String, lowercase: true, required: true, unique: true },
	password: { type: String, default: null },
	temppassword: { type: String },
	temprestricted: { type: Boolean, default: false },
	role: { type: String, required: true, default: 'user' },
	admin: { type: Boolean, required: true, default: false },
	superadmin: { type: Boolean, required: true, default: false },
	verified: { type: Boolean, required: true, default: false },
};

// Pending User Database Model
const pendingUserSchema = {
	name: { type: String, required: true },
	post: { type: String, required: true },
	email: { type: String, lowercase: true, required: true, unique: true },
	message: { type: String }
};

const invitedUserSchema = {
	name: { type: String, required: true },
	post: { type: String, required: true },
	email: { type: String, lowercase: true, required: true, unique: true },
	message: { type: String },
	invitedby: { type: String, lowercase: true, required: true }
};

// Spam User Database Model
const spamUserSchema = {
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true, lowercase: true },
	flaggedby: { type: String, required: true, lowercase: true },
	reason: { type: String, required: true }
}

// Defining Mongoose Model
const User = mongoose.model("User", userSchema);
const PendingUser = mongoose.model("PendingUser", pendingUserSchema);
const InvitedUser = mongoose.model("InvitedUser", invitedUserSchema);
const SpamUser = mongoose.model("SpamUser", spamUserSchema);

// Define Mail Transporter
let transport = nodemailer.createTransport({
	host: process.env.EMAILSMTP,
	port: process.env.EMAILPORT,
	service:process.env.EMAILSERVICE,
	auth: {
		 user: process.env.EMAILID,
		 pass: process.env.EMAILPASS
	}
});

app.get('/', function(req, res){
	res.send("This is a DB Site");
})

app.post('/', function(req, res){
	var randomPingms = Math.floor(Math.random() * 50) + Math.floor(Math.random() * 50);
	res.status(200).send({ server: "running", status: 200, message: "server-running", ping: randomPingms })
})

app.post('/login', function(req, res){
	PendingUser.findOne({ email: req.body.email, post: "User" }, function(error, result){
		if(result){
			console.log(result);
			res.status(200).send({ auth: false, registered: true, token: null, message: "Your Email is Currently Pending Request. Please Wait till Accepting." });
		} else {
			SpamUser.findOne({ email: req.body.email }, function(error, result){
				if(result){
					res.status(200).send({ auth: false, registered: true, token: null, message: "You are Added to Spam List Due to Violation by a Admin. Contact Through Email for Support." });
				} else {
					User.findOne({ email: req.body.email }, function(error, result){
						if(result){
							console.log(bcrypt.compareSync(req.body.password, result.password));
							if(bcrypt.compareSync(req.body.password, result.password)){
								const existUser = result;
								let token = jwt.sign({ result }, process.env.TOKENSECRET, {expiresIn: 604800});
								console.log(token);
								var issueUnix = Math.floor(Date.now() / 1000)
								var expiryUnix = issueUnix + 604800;
								var expiryUnixTime = expiryUnix * 1000;
								var issuedUnixTime = issueUnix * 1000;
								console.log(issueUnix, expiryUnix);
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
						} else {
							res.status(200).send({auth: false, registered: false, token: null, message: "User Not Found with this Email." });
						}
					})
				}
			})
		}
	})
})

app.post('/request', function(req, res){
	PendingUser.findOne({ email: req.body.email }, function(pendingError, pendingResult){
		if(pendingResult){
			res.status(200).send({auth: false, registered: false, message: "You Have Already Requested to Join. Please Wait While We Accept." });
		} else {
			SpamUser.findOne({ email: req.body.email }, function(spamError, spamResult){
				if(spamResult){
					res.status(200).send({auth: false, registered: false, message: "You Already Have an Account and Also You are in our Spam List. Contact through Email to Login." });
				} else {
					User.findOne({ email: req.body.email }, function(error, result){
						if(result){
							res.status(200).send({auth: false, registered: false, message: "User already Registered with this Email." });
						} else {
							InvitedUser.findOne({ email: req.body.email, post: "User" }, function(error, result){
								if(result){
									InvitedUser.deleteOne({ email: req.body.email, post: "User" }, function(error){
										if(error){
											console.log(error);
										} else {
											console.log("Deleted");
										}
									})
								} else {
									console.log("Request Not Found");
								}
							})
							User.find({ admin: true }, function(error, result){
								let adminEmails = [];
								result.forEach((admin, i) => {
									adminEmails.push(admin.email)
								});
								const newPendingUser = new PendingUser({
									name: req.body.name,
									email:req.body.email,
									post: "User",
									message: req.body.message
								});
								newPendingUser.save(function(error, doc){
									if(!error){
										const adminMessage = {
											 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
											 to: adminEmails,
											 replyTo: process.env.REPLYTOMAIL,
											 subject: 'Glory to Heaven - Access Request', // Subject line
											 html: `<p>The Following Person has Requested Access to Glory to Heaven Content.</p><p>If You Know him it is Well and Good, but Don't Accept Unwanted Request and Bloat the Website</p><b><u>Details:</u></b><p>Name: - <b>${req.body.name}</b></p><p>Email - <b>${req.body.email}</b></p><p>Message from Recipient - <b>${req.body.message}</b></p>Any Issues, Reply to this Mail, Our Super Admins will Contact You<p>` // Plain text body
										};
										const userMessage = {
											 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
											 to: req.body.email,
											 replyTo: process.env.REPLYTOMAIL,
											 subject: 'Your Request is Pending Confirmation.', // Subject line
											 html: `<p>Your Request is Pending Confirmation from Admins.</p><p>Till we Process the Data, Please be Patient.</p><p>On Confirmation You will get a Email regarding Confirmation and a OTP will be Sent to Activate your Account</b></p><p>You have to  Activate Your Account within 3 Hours of Confirmation Mail, Otherwise your Account will be deleted Automatically.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
										};
										transport.sendMail(adminMessage, function(error, info){
											if(error){
												console.log(error);
											} else {
												console.log(info);
											}
										})
										transport.sendMail(userMessage, function(error, info){
											if(error){
												console.log(error);
											} else {
												console.log(info);
											}
										})
										res.status(200).send({auth: true, registered: true, message: "Your Request has been Sent to our Admins for Processing" });
									} else {
										res.status(200).send({auth: false, registered: true, message: "Ther's an Error Processing Your Request. Please Try Again Later." });
									}
								})
							})
						}
					})
				}
			})
		}
	})
})

app.post('/register-newuser', function(req, res){
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
																			User.updateOne({ email: req.body.adminuseremail }, { $set: { temprestricted: true } }, function(error){
																				if(error){
																					console.log(error);
																				} else {
																					setTimeout(() => {
																						User.updateOne({ email: req.body.adminuseremail }, { $set: { temprestricted: false } }, function(error){
																							if(error){
																								console.log(error);
																							} else {
																								console.log('Updated back')
																							}
																						})
																					}, 86400000);
																				}
																			});
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
																	setTimeout(() => {
																		User.findOne({ email: req.body.email }, function(error, result){
																			if(!result){
																				console.log(error);
																			} else if(result){
																				var tempPassIsThere = result.temppassword != null ? true : false;
																				var passNotThere = result.password == null ? true : false;
																				if(tempPassIsThere && passNotThere){
																					User.deleteOne({ email: req.body.email }, function(error){
																						if(error){
																							res.send(error);
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
																							User.updateOne({ email: req.body.adminuseremail }, { $set: { temprestricted: true } }, function(error){
																								if(error){
																									console.log(error);
																								} else {
																									const adminrestricMessage = {
																										 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
																										 to: req.body.adminuseremail,
																										 replyTo: process.env.REPLYTOMAIL,         // List of recipients
																										 subject: 'Don\'t Add Spam users', // Subject line
																										 html: `<p>Don't Use Your Admin Powers to Spam this Website, the User - ${req.body.email} is a Spam, Since he Didn't Signup in the Website with OTP. You have been Blocked from Adding new Users for One Day</p><p>If you think this the Recipient is Not a Spam Email, Reply to this mail to Remove restriction on your Account</p>` // Plain text body
																									};
																									transport.sendMail(adminrestricMessage, function(err, info){
																										if(err){
																											console.log(err);
																										} else {
																											console.log(info);
																										}
																									});
																									setTimeout(() => {
																										User.updateOne({ email: req.body.adminuseremail }, { $set: { temprestricted: false } }, function(error){
																											if(error){
																												console.log(error);
																											} else {
																												console.log('updated back')
																											}
																										})
																									}, 86400000);
																								}
																							})
																							const deleteMessage = {
																								 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
																								 to: req.body.email,
																								 replyTo: process.env.REPLYTOMAIL,         // List of recipients
																								 subject: 'Deletion of Your Account.', // Subject line
																								 html: `<p>Your Account has been Deleted Automatically, Since You didn't Use the Sent One Time Password</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
																							};
																							transport.sendMail(deleteMessage, function(err, info){
																								if(err){
																									console.log(err);
																								} else {
																									console.log(info);
																								}
																							})
																						}
																					})
																				}
																			}
																		})
																	}, 10800000);
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
});

app.post('/spamuser', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
			if(result.admin){
				if(bcrypt.compareSync(req.body.adminpass, result.password)){
					User.findOne({ email: req.body.email }, function(error, result){
						if(result){
							const spamUser = new SpamUser({
								name: result.name,
								email: result.email,
								flaggedby: req.body.adminuseremail,
								message: req.body.message
							})
							spamUser.save(function(error, doc){
								if(error){
									res.status(200).send({ auth: true, registered: false, message: "Error Processing Request. Try Again Later" });
								} else {
									const message = {
										 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
										 to: req.body.email,
										 replyTo: process.env.REPLYTOMAIL,
										 subject: 'You Have Been Flagged', // Subject line
										 html: `<p>You Have been Flagged by Admin - ${req.body.adminuseremail} for the Reason - ${req.body.message}.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
									};
									transport.sendMail(message, function(err, info){
										if(err){
											console.log(err);
										} else {
											console.log(info);
										}
									})
									res.status(200).send({ auth: true, registered: true, message: 'User has Been Added to Spam User Database.'});
								}
							})
						} else {
							res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
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
})

app.post('/spamadmin', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
			if(result.admin){
				if(result.superadmin){
					if(bcrypt.compareSync(req.body.adminpass, result.password)){
						User.findOne({ email: req.body.email }, function(error, result){
							if(result){
								const spamUser = new SpamUser({
									name: result.name,
									email: result.email,
									flaggedby: req.body.adminuseremail,
									message: req.body.message
								})
								spamUser.save(function(error, doc){
									if(error){
										res.status(200).send({ auth: true, registered: false, message: "Error Processing Request. Try Again Later" });
									} else {
										const message = {
											 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
											 to: req.body.email,
											 replyTo: process.env.REPLYTOMAIL,
											 subject: 'You Have Been Flagged', // Subject line
											 html: `<p>You Have been Flagged by Admin - ${req.body.adminuseremail} for the Reason - ${req.body.message}.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
										};
										transport.sendMail(message, function(err, info){
											if(err){
												console.log(err);
											} else {
												console.log(info);
											}
										})
										res.status(200).send({ auth: true, registered: true, message: 'Admin has Been Added to Spam User Database.'});
									}
								})
							} else {
								res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
							}
						})
					} else {
						res.status(200).send({ auth: false, registered: true, message: "Your Admin Password does Not Match with our Records" })
					}
				} else {
					res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
				}
			} else {
				res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
			}
		} else {
			res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
		}
	})
})

app.post('/getspamusers', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
			if(result.admin){
				SpamUser.find({}, function(error, result){
					if(result){
						if(result.length == 0){
							res.status(200).send({ auth: false, registered: true, message: "Error Processing Your Request." })
						} else {
							res.status(200).send({ auth: true, registered: true, users: result })
						}
					} else {
						res.status(200).send({ auth: false, registered: true, message: "Error Processing Your Request." })
					}
				})
			} else {
				res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
			}
		} else {
			res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
		}
	})
})

app.post('/inviteusers', function(req, res){
	InvitedUser.findOne({ email: req.body.email, post: "User" }, function(error, result){
		if(result){
			res.status(200).send({ auth: false, registered: true, message: 'User is Already Invited. Do not Send Another Time.'});
		} else {
			User.findOne({ email: req.body.adminuseremail }, function(error, result){
				if(result){
					if(result.admin){
						User.findOne({ email: req.body.email }, function(error, result){
							if(result){
								if(result.superadmin){
									res.status(200).send({ auth: false, registered: true, message: "User is Already Present & he is a Super Admin." })
								} else {
									if(result.admin){
										res.status(200).send({ auth: false, registered: true, message: "User is Already Present & he is a Admin." })
									} else {
											res.status(200).send({ auth: false, registered: true, message: "User is Already Present" })
									}
								}
							} else {
								const newInvitedAdmin = new InvitedUser({
									name: req.body.name,
									email: req.body.email,
									post: "User",
									message: req.body.message,
									invitedby: req.body.adminuseremail
								})
								newInvitedAdmin.save(function(error, doc){
									if(error){
										res.status(200).send({ auth: false, registered: true, message: "Error Processing Your Request." })
									} else {
										const message = {
											 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
											 to: req.body.email,
											 replyTo: process.env.REPLYTOMAIL,
											 subject: 'You have been Invited for Admin Post', // Subject line
											 html: `<p>You Have been Invited for Admin by - ${req.body.adminuseremail}. His Message to You - ${req.body.message}.</p><p> If You Accept this Invite, then go to MySettings Page and Request Admin Status.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
										};
										transport.sendMail(message, function(err, info){
											if(err){
												console.log(err);
											} else {
												console.log(info);
											}
										})
										res.status(200).send({ auth: true, registered: true, message: 'An Invite Email has been Sent to his Email Address.'});
									}
								})
							}
						})
					} else {
						res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
					}
				} else {
					res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
				}
			})
		}
	})
})

app.post('/inviteadmin', function(req, res){
	InvitedUser.findOne({ email: req.body.email, post: "Admin" }, function(error, result){
		if(result){
			res.status(200).send({ auth: false, registered: true, message: 'User is Already Invited. Do not Send Another Time.'});
		} else {
			User.findOne({ email: req.body.adminuseremail }, function(error, result){
				if(result){
					if(result.admin){
						if(result.superadmin){
							User.findOne({ email: req.body.email }, function(error, result){
								if(result){
									if(result.superadmin){
										res.status(200).send({ auth: false, registered: true, message: "User is Already a Super Admin." })
									} else {
										if(result.admin){
											res.status(200).send({ auth: false, registered: true, message: "User is Already a Admin." })
										} else {
											const newInvitedAdmin = new InvitedUser({
												name: result.name,
												email: result.email,
												post: "Admin",
												message: req.body.message,
												invitedby: req.body.adminuseremail
											})
											newInvitedAdmin.save(function(error, doc){
												if(error){
													res.status(200).send({ auth: false, registered: true, message: "Error Processing Your Request." })
												} else {
													const message = {
														 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
														 to: req.body.email,
														 replyTo: process.env.REPLYTOMAIL,
														 subject: 'You have been Invited for Admin Post', // Subject line
														 html: `<p>You Have been Invited for Admin by - ${req.body.adminuseremail}. His Message to You - ${req.body.message}.</p><p> If You Accept this Invite, then go to MySettings Page and Request Admin Status.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
													};
													transport.sendMail(message, function(err, info){
														if(err){
															console.log(err);
														} else {
															console.log(info);
														}
													})
													res.status(200).send({ auth: true, registered: true, message: 'An Invite Email has been Sent to his Email Address.'});
												}
											})
										}
									}
								} else {
									res.status(200).send({ auth: false, registered: true, message: "No User Found with This Email." })
								}
							})
						} else {
							res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
						}
					} else {
						res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
					}
				} else {
					res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
				}
			})
		}
	})
})

app.post('/invitesuperadmin', function(req, res){
	InvitedUser.findOne({ email: req.body.email, post: "SuperAdmin"}, function(error,result){
		if(result){
			res.status(200).send({ auth: false, registered: true, message: 'User is Already Invited. Do not Send Another Time.'});
		} else {
			User.findOne({ email: req.body.adminuseremail }, function(error, result){
				if(result){
					if(result.admin){
						if(result.superadmin){
							User.findOne({ email: req.body.email }, function(error, result){
								if(result){
									if(result.superadmin){
										res.status(200).send({ auth: false, registered: true, message: "User is Already a Super Admin." })
									} else {
										if(result.admin){
											const newInvitedAdmin = new InvitedUser({
												name: result.name,
												email: result.email,
												post: "SuperAdmin",
												message: req.body.message,
												invitedby: req.body.adminuseremail
											})
											newInvitedAdmin.save(function(error, doc){
												if(error){
													res.status(200).send({ auth: false, registered: true, message: "Error Processing Your Request." })
												} else {
													const message = {
														 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
														 to: req.body.email,
														 replyTo: process.env.REPLYTOMAIL,
														 subject: 'You have been Invited for SuperAdmin Post', // Subject line
														 html: `<p>You Have been Invited for SuperAdmin by - ${req.body.adminuseremail}. His Message to You - ${req.body.message}.</p><p> If You Accept this Invite, then go to MySettings Page and Request SuperAdmin Status.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
													};
													transport.sendMail(message, function(err, info){
														if(err){
															console.log(err);
														} else {
															console.log(info);
														}
													})
													res.status(200).send({ auth: true, registered: true, message: 'An Invite Email has been Sent to his Email Address.'});
												}
											})
										} else {
												res.status(200).send({ auth: false, registered: true, message: "User Should be an Admin to become a Superadmin" })
										}
									}
								} else {
									res.status(200).send({ auth: false, registered: true, message: "No User Found with This Email." })
								}
							})
						} else {
							res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
						}
					} else {
						res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
					}
				} else {
					res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
				}
			})
		}
	})
})

app.post('/getpendingusers', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
			if(result.admin){
				PendingUser.find({ post: "User" }, function(error, result){
					if(result.length == 0){
						res.status(200).send({ auth: false, registered: true, message: "No Pending Users" })
					} else {
						res.status(200).send({ auth: true, registered: true, users: result })
					}
				})
			} else {
				res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
			}
		} else {
			res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
		}
	})
})

app.post('/getpendingadmins', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
			if(result.admin){
				if(result.superadmin){
					PendingUser.find({ post: "Admin" }, function(error, result){
						if(result.length == 0){
							res.status(200).send({ auth: false, registered: true, message: "No Pending Users" })
						} else {
							res.status(200).send({ auth: true, registered: true, users: result })
						}
					})
				} else {
					res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
				}
			} else {
				res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
			}
		} else {
			res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
		}
	})
})

app.post('/getpendingsuperadmins', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
			if(result.admin){
				if(result.superadmin){
					PendingUser.find({ post: "SuperAdmin" }, function(error, result){
						if(result.length == 0){
							res.status(200).send({ auth: false, registered: true, message: "No Pending Users" })
						} else {
							res.status(200).send({ auth: true, registered: true, users: result })
						}
					})
				} else {
					res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
				}
			} else {
				res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
			}
		} else {
			res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
		}
	})
})

app.post('/adminperms', function(req, res){
	PendingUser.findOne({ email: req.body.email, post: "Admin" }, function(error, result){
		if(result){
			User.findOne({ email: req.body.adminuseremail }, function(error, result){
				if(result){
					if(result.admin && result.superadmin){
						if(bcrypt.compareSync(req.body.adminpass, result.password)){
							User.findOne({ email: req.body.email }, function(error, result){
								if(result){
									if(result.superadmin){
										res.status(200).send({ auth: true, changed: false, message: "User is Already a Super Admin" });
									} else if(result.admin) {
										res.status(200).send({ auth: true, changed: false, message: "User is Already a Admin" });
									} else {
										User.updateOne({ email: req.body.email }, { $set: { admin: true, role: "Admin" } }, function(error){
											if(!error){
												const promoteMessage = {
													 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
													 to: req.body.email,
													 bcc: req.body.ADMINEMAIL,
													 replyTo: process.env.REPLYTOMAIL,         // List of recipients
													 subject: 'Account Promoted to Admin Status.', // Subject line
													 html: `<p>Your Account has been Promoted to Admin by Super Admin - ${req.body.adminuseremail}, Please Use your Admin Powers Wisely.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
												};
												transport.sendMail(promoteMessage, function(error, info){
													if(error){
														console.log(error);
													} else {
														console.log(info);
													}
												})
												InvitedUser.deleteOne({ email: req.body.email, post: "Admin" }, function(error){
													if(error){
														console.log(error)
													} else {
														console.log("Not Found");
													}
												})
												PendingUser.deleteOne({ email: req.body.email, post: "Admin" }, function(error){
													if(error){
														console.log(error)
													} else {
														console.log("Not Found");
													}
												})
												res.status(200).send({ auth: true, registered: true, changed: true, message: "User has been Promoted to Admin" });
											} else {
													res.status(200).send({ auth: true, registered: true, changed: false, message: "Some Error Pinging the Servers. Try Again Later." });
											}
										})
									}
								} else {
									res.status(200).send({ auth: true, registered: true, changed: false, message: "No User Found with this Email" });
								}
							});
						} else {
							res.status(200).send({ auth: false, registered: true, changed: false, message: "Your Admin Password is Wrong" });
						}
					} else {
						res.status(200).send({ auth: false, registered: false, changed: false, message: "You are Unauthorized" });
					}
				} else {
					res.status(200).send({ auth: false, registered: false, changed: false, message: "BAD REQUEST" });
				}
			})
		} else {
			res.status(200).send({ auth: true, changed: false, message: "A User has to Specifically Request to Become a Admin to Promote Him. This is to Ensure Participation from Both Sides." });
		}
	})
});

app.post('/superadminperms', function(req, res){
	PendingUser.findOne({ email: req.body.email, post: "SuperAdmin" }, function(error, result){
		if(result){
			User.findOne({ email: req.body.adminuseremail }, function(error, result){
				if(result){
					if(result.admin && result.superadmin){
						if(bcrypt.compareSync(req.body.adminpass, result.password)){
							if(result.temprestricted){
								res.status(200).send({ auth: false, registered: true, changed: false, message: "You Have been Temporarily Restricted from Modifying Permissions of Users." });
							} else {
								User.findOne({ email: req.body.email }, function(error, result){
									if(result){
										if(result.admin){
											if(result.superadmin){
												res.status(200).send({ auth: true, registered: true, changed: false, message: "User is already a Super Admin" });
											} else {
												User.updateOne({ email: req.body.email }, { $set: { superadmin: true, role: "Super Admin" } }, function(error){
													if(error){
														res.status(200).send({ auth: true, registered: true, changed: false, message: "Some Error Pinging the Servers. Try Again Later." });
													} else {
														const promoteMessage = {
															 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
															 to: req.body.email,
															 bcc: req.body.ADMINEMAIL,
															 replyTo: process.env.REPLYTOMAIL,         // List of recipients
															 subject: 'Account Promoted to Super Admin Status.', // Subject line
															 html: `<p>Your Account has been Promoted to Super Admin by Super Admin - ${req.body.adminuseremail}, Please Use your Super Admin Powers Wisely.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
														};
														transport.sendMail(promoteMessage, function(error, info){
															if(error){
																console.log(error);
															} else {
																console.log(info);
															}
														});
														InvitedUser.deleteOne({ email: req.body.email, post: "SuperAdmin" }, function(error){
															if(error){
																console.log(error)
															} else {
																console.log("Not Found");
															}
														})
														PendingUser.deleteOne({ email: req.body.email, post: "SuperAdmin" }, function(error){
															if(error){
																console.log(error)
															} else {
																console.log(error)
															}
														})
														res.status(200).send({ auth: true, registered: true, changed: true, message: "User has been Promoted to Super Admin" });
													}
												})
											}
										} else {
											res.status(200).send({ auth: true, registered: true, changed: false, message: "User Should be a Admin to be Promoted to Super Admin" });
										}
									} else {
										res.status(200).send({ auth: true, registered: false, changed: false, message: "No User Found with this Email" });
									}
								})
							}
						} else {
							res.status(200).send({ auth: false, registered: true, changed: false, message: "Your Admin Password is Wrong" });
						}
					} else {
						res.status(200).send({ auth: false, registered: false, changed: false, message: "You are Unauthorized" });
					}
				} else {
					res.status(200).send({ auth: false, token: false, registered: false, changed: false, message: "BAD REQUEST" });
				}
			})
		} else {
			res.status(200).send({ auth: true, changed: false, message: "A User has to Specifically Request to Become a Super Admin to Promote Him. This is to Ensure Participation from Both Sides." });
		}
	})
})

app.post('/requestadmin', function(req, res){
	PendingUser.findOne({ email: req.body.email, post: "Admin" }, function(error, result){
		if(result){
			res.status(200).send({ auth: true, changed: false, message: "You are Allowed to Request only One Time.Please Wait" });
		} else {
			User.findOne({ email: req.body.email }, function(error, result){
				if(result){
					if(result.superadmin){
						res.status(200).send({ auth: true, changed: false, message: "You are a Already a Super Admin" });
					} else {
						if(result.admin){
							res.status(200).send({ auth: true, changed: false, message: "You are Already an Admin." });
						} else {
							User.find({ superadmin: true }, function(error, result){
								let adminEmails = [];
								result.forEach((admin, i) => {
									adminEmails.push(admin.email)
								});
								const newPendingUser = new PendingUser({
									name: req.body.name,
									email: req.body.email,
									post: "Admin",
									message: req.body.message
								})
								newPendingUser.save(function(error, doc){
									if(error){
										res.status(200).send({ auth: true, changed: false, message: "Error Sending Your Request." });
									} else {
										const adminMessage = {
											 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
											 to: adminEmails,
											 replyTo: process.env.REPLYTOMAIL,
											 subject: 'Glory to Heaven - Admin Request', // Subject line
											 html: `<p>The Following Person has Requested Admin Previlage to Glory to Heaven.</p><b><u>Details:</u></b><p>Name: - <b>${req.body.name}</b></p><p>Email - <b>${req.body.email}</b></p><p>Message from Recipient - <b>${req.body.message}</b></p>Any Issues, Reply to this Mail, Our Super Admins will Contact You<p>` // Plain text body
										};
										const userMessage = {
											 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
											 to: req.body.email,
											 replyTo: process.env.REPLYTOMAIL,
											 subject: 'Your Request is Pending Confirmation.', // Subject line
											 html: `<p>Your Request is Pending Confirmation from Admins.</p><p>Till we Process the Data, Please be Patient.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
										};
										transport.sendMail(adminMessage, function(error, info){
											if(error){
												console.log(error);
											} else {
												console.log(info);
											}
										})
										transport.sendMail(userMessage, function(error, info){
											if(error){
												console.log(error);
											} else {
												console.log(info);
											}
										})
										res.status(200).send({auth: true, registered: true, message: "Your Request has been Sent to our Admins for Processing" });
									}
								})
							})
						}
					}
				} else {
					res.status(200).send({ auth: true, changed: false, message: "BAD REQUEST" });
				}
			})
		}
	})
})

app.post('/requestsuperadmin', function(req, res){
	PendingUser.findOne({ email: req.body.email, post: "SuperAdmin" }, function(error, result){
		if(result){
			res.status(200).send({ auth: true, changed: false, message: "You are Allowed to Request only One Time.Please Wait" });
		} else {
			User.findOne({ email: req.body.email }, function(error, result){
				if(result){
					if(result.superadmin){
						res.status(200).send({ auth: true, changed: false, message: "You are a Already a Super Admin" });
					} else {
						if(result.admin){
							User.find({ superadmin: true }, function(error, result){
								let adminEmails = [];
								result.forEach((admin, i) => {
									adminEmails.push(admin.email)
								});
								const newPendingUser = new PendingUser({
									name: req.body.name,
									email: req.body.email,
									post: "Admin",
									message: req.body.message
								})
								newPendingUser.save(function(error, doc){
									if(error){
										res.status(200).send({ auth: true, changed: false, message: "Error Sending Your Request." });
									} else {
										const adminMessage = {
											 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
											 to: adminEmails,
											 replyTo: process.env.REPLYTOMAIL,
											 subject: 'Glory to Heaven - Admin Request', // Subject line
											 html: `<p>The Following Person has Requested Super-Admin Previlage to Glory to Heaven.</p><b><u>Details:</u></b><p>Name: - <b>${req.body.name}</b></p><p>Email - <b>${req.body.email}</b></p><p>Message from Recipient - <b>${req.body.message}</b></p>Any Issues, Reply to this Mail, Our Super Admins will Contact You<p>` // Plain text body
										};
										const userMessage = {
											 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
											 to: req.body.email,
											 replyTo: process.env.REPLYTOMAIL,
											 subject: 'Your Request is Pending Confirmation.', // Subject line
											 html: `<p>Your Request is Pending Confirmation from Admins.</p><p>Till we Process the Data, Please be Patient.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
										};
										transport.sendMail(adminMessage, function(error, info){
											if(error){
												console.log(error);
											} else {
												console.log(info);
											}
										})
										transport.sendMail(userMessage, function(error, info){
											if(error){
												console.log(error);
											} else {
												console.log(info);
											}
										})
										res.status(200).send({auth: true, registered: true, message: "Your Request has been Sent to our Admins for Processing" });
									}
								})
							})
						} else {
							res.status(200).send({ auth: true, changed: false, message: "You Need to be a Admin to Request to be a Super Admin." });
						}
					}
				} else {
					res.status(200).send({ auth: true, changed: false, message: "BAD REQUEST" });
				}
			})
		}
	})
})

app.post('/deleteuser', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
			if(result.admin){
				if(bcrypt.compareSync(req.body.adminpass, result.password)){
					if(result.temprestricted){
						res.status(200).send({ auth: false, registered: true, deleted: false, message: "You Have been Temporarily Restricted from Modifying Permissions of Users." });
					} else {
						User.findOne({ email: req.body.email }, function(error, result){
							if(result){
								if(result.admin){
									res.status(200).send({ auth: false, registered: true, deleted: false, message: "You are Trying to Remove a Admin. Permission Scope Not there." });
								} else {
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
												 html: `<p>Your Account has been Deleted by Super Admin - ${req.body.adminuseremail}</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You.</p>` // Plain text body
											};
											transport.sendMail(deleteMessage, function(error, info){
												if(error){
													console.log(error);
												} else {
													console.log(info);
												}
											})
											res.status(200).send({ auth: true, registered: true, deleted: true, message: "User has been deleted" });
										}
									})
								}
							} else {
								res.status(200).send({ auth: true, registered: true, deleted: false, message: "No User Found with this Email" });
							}
						})
					}
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

app.post('/deleteme', function(req, res){
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

app.post('/deleteadmin', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
			if(result.admin && result.superadmin){
				if(bcrypt.compareSync(req.body.adminpass, result.password)){
					if(result.temprestricted){
						res.status(200).send({ auth: false, registered: true, deleted: false, message: "You Have been Temporarily Restricted from Modifying Permissions of Users." });
					} else {
						User.findOne({ email: req.body.email }, function(error, result){
							if(result){
								User.deleteOne({ email: req.body.email }, function(error){
									if(error){
										res.status(200).send({ auth: true, token: true, registered: true, deleted: false, message: "Some Error Pinging the Servers. Try Again Later." });
									} else {
										const deleteMessage = {
											 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
											 to: req.body.email,
											 bcc: req.body.ADMINEMAIL,
											 replyTo: process.env.REPLYTOMAIL,         // List of recipients
											 subject: 'Account has been Deleted.', // Subject line
											 html: `<p>Your Account has been Deleted by Super Admin - ${req.body.adminuseremail}</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You.</p>` // Plain text body
										};
										transport.sendMail(deleteMessage, function(error, info){
											if(error){
												console.log(error);
											} else {
												console.log(info);
											}
										});
										res.status(200).send({ auth: true, registered: true, deleted: true, message: "User has been deleted" });
									}
								})
							} else {
								res.status(200).send({ auth: true, registered: true, deleted: false, message: "No User Found with this Email" });
							}
						})
					}
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
})

app.post('/getusers', function(req, res){
	User.findOne({ email: req.body.email }, function(error, result){
		if(result){
			if(result.admin){
				User.find({ admin: false, superadmin: false }, function(error, result){
					if(result){
						if(result.length == 0){
							res.status(200).send({ auth: false, registered: false, message: "No Users Found" });
						} else {
							const secureUsers = result.map(item => {
								return {
									name: item['name'],
									email: item['email'],
									admin: item['admin'],
									superadmin: item['superadmin'],
									verified: item['verified'],
									role: item['role']
								}
							})
								res.status(200).send({ auth: true, registered: true, users: secureUsers });
							}
						} else {
							res.status(200).send({ auth: false, registered: false, message: "Error Processing Your Request" });
						}
					})
			} else {
				res.status(200).send({ auth: false, registered: false, message: "You are Unauthorized" });
			}
		} else {
			res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" });
		}
	})
})

app.post('/getall', function(req, res){
	User.findOne({ email: req.body.email }, function(error, result){
		if(result){
			if(result.admin){
				if(result.superadmin){
					User.find({}, function(error, result){
						if(result){
							if(result.length == 0){
								res.status(200).send({ auth: false, registered: false, message: "No Users Found" });
							} else {
								const secureUsers = result.map(item => {
									return {
										name: item['name'],
										email: item['email'],
										admin: item['admin'],
										superadmin: item['superadmin'],
										verified: item['verified'],
										role: item['role']
									}
								})
									res.status(200).send({ auth: true, registered: true, users: secureUsers });
							}
						} else {
							res.status(200).send({ auth: false, registered: false, message: "Error Processing Your Request" });
						}
					})
				} else {
					res.status(200).send({ auth: false, registered: false, message: "You are Unauthorized" });
				}
			} else {
				res.status(200).send({ auth: false, registered: false, message: "You are Unauthorized" });
			}
		} else {
			res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" });
		}
	})
})

app.post('/getadmins', function(req, res){
	User.findOne({ email: req.body.email }, function(error, result){
		if(result){
			if(result.admin){
				if(result.superadmin){
					User.find({ admin: true, superadmin: false }, function(error, result){
						if(result){
							if(result.length == 0){
								res.status(200).send({ auth: false, registered: false, message: "No Users Found" });
							} else {
								const secureUsers = result.map(item => {
									return {
										name: item['name'],
										email: item['email'],
										admin: item['admin'],
										superadmin: item['superadmin'],
										verified: item['verified'],
										role: item['role']
									}
								})
									res.status(200).send({ auth: true, registered: true, users: secureUsers });
							}
						} else {
							res.status(200).send({ auth: false, registered: false, message: "Error Processing Your Request" });
						}
					})
				} else {
					res.status(200).send({ auth: false, registered: false, message: "You are Unauthorized" });
				}
			} else {
				res.status(200).send({ auth: false, registered: false, message: "You are Unauthorized" });
			}
		} else {
			res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" });
		}
	})
})

app.post('/getsuperadmins', function(req, res){
	User.findOne({ email: req.body.email }, function(error, result){
		if(result){
			if(result.admin){
				if(result.superadmin){
					User.find({ admin: true, superadmin: true }, function(error, result){
						if(result){
							if(result.length == 0){
								res.status(200).send({ auth: false, registered: false, message: "No Users Found" });
							} else {
								const secureUsers = result.map(item => {
									return {
										name: item['name'],
										email: item['email'],
										admin: item['admin'],
										superadmin: item['superadmin'],
										verified: item['verified'],
										role: item['role']
									}
								})
									res.status(200).send({ auth: true, registered: true, users: secureUsers });
							}
						} else {
							res.status(200).send({ auth: false, registered: false, message: "Error Processing Your Request" });
						}
					})
				} else {
					res.status(200).send({ auth: false, registered: false, message: "You are Unauthorized" });
				}
			} else {
				res.status(200).send({ auth: false, registered: false, message: "You are Unauthorized" });
			}
		} else {
			res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" });
		}
	})
})

app.post('/verify', function(req, res){
	jwt.verify(req.body.token, process.env.TOKENSECRET, function(error, decoded){
		if(decoded){
			var expiryUnixTime = decoded.exp * 1000;
			var issuedUnixTime = decoded.iat * 1000;
			const issueDate = new Date(issuedUnixTime).toLocaleString();
			const expiryDate = new Date(expiryUnixTime).toLocaleString();
			console.log(issueDate);
			console.log(expiryDate);
			res.status(200).send({ auth: true, registered: true, tokenuser: decoded, issuedate: issueDate, expirydate: expiryDate });
		} else {
			res.status(200).send({auth: false, registered: false, tokenuser: null});
		}
	});
})

app.post('/change-password', function(req, res){
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

app.post('/change-otp', function(req, res){
	User.findOne({ email: req.body.email }, function(error, result){
		if(result){
			var tempPassIsThere = result.temppassword != null ? true : false;
			var passNotThere = result.password == null ? true : false;
			if(tempPassIsThere && passNotThere){
				if(bcrypt.compareSync(req.body.otp, result.temppassword)){
					var newPass = req.body.newpassword;
					User.updateOne({ email: req.body.email }, {$set: { password: bcrypt.hashSync(newPass, 10), temppassword: null, verified: true }}, function(error){
						if(!error){
							const otpMessage = {
								 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
								 to: req.body.email,
								 bcc: process.env.ADMINEMAIL,
								 replyTo: process.env.REPLYTOMAIL,        // List of recipients
								 subject: 'Account Verified', // Subject line
								 html: `<b>Your email ${req.body.email} has been Verified. Now you can Login with Your Password.</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
							};
							transport.sendMail(otpMessage, function(err, info){
								if(err){
									console.log(err);
								} else {
									console.log(info);
								}
							});
							res.status(200).send({ auth: true, registered: true, changed: true, message: `Your email ${req.body.email} has been Verified.`});
						} else {
							res.status(200).send({ auth: true, registered: true, changed: false, message: 'Error While Changing password'})
						}
					})
				} else {
					res.status(200).send({ auth: true, registered: true, changed: false, message: "Wrong OTP" })
				}
			} else {
				res.status(200).send({ auth: true, registered: true, changed: false, message: "It Looks Like You Already Have been Verified" })
			}
		} else {
			res.status(200).send({ auth: false, registered: false, changed: false, message: "Bad Request" })
		}
	})
});

app.listen(process.env.PORT || 3000, function () {
	console.log("Server is Running");
})
