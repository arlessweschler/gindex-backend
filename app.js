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

const allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
}

app.use(allowCrossDomain)

mongoose.connect(process.env.DBURL, {useNewUrlParser: true,  useUnifiedTopology: true, useCreateIndex: true})

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

const userSchema = {
  name: { type: String, required: true },
  email: { type: String, lowercase: true, required: true, unique: true },
	password: { type: String, default: null },
	temppassword: { type: String },
	temprestricted: { type: Boolean, default: false },
	role: { type: String, required: true, default: 'user' },
	admin: { type: Boolean, required: true, default: false },
	superadmin: { type: Boolean, required: true, default: false },
};

const User = mongoose.model("User", userSchema);

let transport = nodemailer.createTransport({
	host: process.env.EMAILSMTP,
	port: process.env.EMAILPORT,
	service:'SendinBlue',
	auth: {
		 user: process.env.EMAILID,
		 pass: process.env.EMAILPASS
	}
});

app.post('/login', function(req, res){
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
				const issueDate = new Date(issuedUnixTime).toLocaleString();
				const expiryDate = new Date(expiryUnixTime).toLocaleString();
				console.log(issueUnix, expiryUnix);
				const tokenMessage = {
					 from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
					 to: req.body.email,
					 replyTo: process.env.REPLYTOMAIL,         // List of recipients
					 subject: 'New Token has Been Generated', // Subject line
					 html: `<b>Glory to Heaven</b><p>New Login Token has been Generated.</p><p> Issue Date - ${issueDate}</p><p> Expiry Date - ${expiryDate}</p>` // Plain text body
				};
				// transport.sendMail(tokenMessage, function(error, info){
				// 	if(error){
				// 		console.log(error);
				// 	} else {
				// 		console.log(info);
				// 	}
				// })
        res.status(200).send({ auth: true, registered: true, token: token, issuedat: issueDate, expiryat: expiryDate });
      } else {
        res.status(200).send({ auth: false, registered: true, token: null, message: "User Password is Wrong" });
      }
    } else {
      res.status(200).send({auth: false, registered: false, token: null, message: "User Not Found with this Email." });
    }
  })
})

app.post('/register-newuser', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
				if(result.admin){
					if(bcrypt.compareSync(req.body.adminpass, result.password)){
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
									superadmin: false
								})
								 console.log(newUser)
								 newUser.save(function(error, doc){
									 if(!error){
									 	const message = {
									     from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
									     to: req.body.email,
											 replyTo: process.env.REPLYTOMAIL,
									     subject: 'We Have Accepted Your Request.', // Subject line
									     html: `<b>As Per Your Request We have Registered you in Our Website</b><p>Now You can Login with Your Email</p><p>Here is Your One Time Password - <b>${temporaryPass}</b></p><p>One Time Password is Valid for only 3 Hours</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
									 	};
									 	transport.sendMail(message, function(err, info) {
									 	    if (err) {
													User.deleteOne({ email: req.body.email}, function(error){
														if(error){
															console.log(error);
														} else {
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
										 res.status(200).send({ auth: true, registered: false, message: "Error Saving User" });
										 console.log(error);
									 }
								 });
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

app.post('/register-admin', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
			if(result.admin && result.superadmin){
				if(bcrypt.compareSync(req.body.adminpass, result.password)){
					User.findOne({ email: req.body.email }, function(error, result){
						if(result){
							res.status(200).send({ auth: false, registered: true, message: "User Already Exists with this Email. Try Converting Existing user to Admin/Super Admin" });
						} else {
							var temporaryPass = randomstring.generate({ length: 8, charset: 'alphanumeric' });
							const newUser = new User({
								name: req.body.name,
								email: req.body.email,
								temppassword: bcrypt.hashSync(temporaryPass, 10),
								role: "Admin",
								admin: true,
								superadmin: false
							})
							console.log(newUser)
							newUser.save(function(error, doc){
								if(!error){
									const message = {
										from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
										to: req.body.email,
										bcc: process.env.ADMINEMAIL,
										replyTo: process.env.REPLYTOMAIL,
										subject: 'You have been Appointed as Admin', // Subject line
										html: `<b>As Per Your Request We have Registered you in Our Website as a Admin</b><p>Now You can Login with Your Email</p><p>Here is Your One Time Password - <b>${temporaryPass}</b></p><p>Note: One Time Password is Valid for only 3 Hours</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
									}
									transport.sendMail(message, function(err, info) {
											if (err) {
												User.deleteOne({ email: req.body.email}, function(error){
													if(error){
														console.log(error);
													} else {
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
																console.log(info);
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
												res.status(200).send({ auth: true, registered: true, message: 'User Successfully Registered.One Time Password has been sent to Recipient Mail that is Valid for 3 Hours. In case the Recipient Did\'t Signup within this Period. Their Account will be Automatically Deleted.'});
											}
									});
								} else {
									res.status(200).send({ auth: false, registered: false, message: "Error Saving User" });
									console.log(error);
								}
							})
						}
					})
				} else {
					res.status(200).send({ auth: false, registered: false, message: "Admin Password Wrong" })
				}
			} else {
				res.status(200).send({ auth: false, registered: false, message: "You are Not Authorized to Register Admin Users" })
			}
		} else {
			res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
		}
	})
});

app.post('/register-superadmin', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
			if(result.admin && result.superadmin){
				if(bcrypt.compareSync(req.body.adminpass, result.password)){
					User.findOne({ email: req.body.email }, function(error, result){
						if(result){
							res.status(200).send({ auth: false, registered: true, message: "User Already Exists with this Email. Try Converting Existing user to Admin/Super Admin" });
						} else {
							var temporaryPass = randomstring.generate({ length: 8, charset: 'alphanumeric' });
							const newUser = new User({
								name: req.body.name,
								email: req.body.email,
								temppassword: bcrypt.hashSync(temporaryPass, 10),
								role: "Super Admin",
								admin: true,
								superadmin: true
							})
							console.log(newUser)
							newUser.save(function(error, doc){
								if(!error){
									const message = {
										from: `"Glory to Heaven - Support"<${process.env.EMAILID}>`, // Sender address
										to: req.body.email,
										replyTo: process.env.REPLYTOMAIL,
										subject: 'You have been Appointed as Super Admin', // Subject line
										html: `<b>As Per Your Request We have Registered you in Our Website as a Admin</b><p>Now You can Login with Your Email</p><p>Here is Your One Time Password - <b>${temporaryPass}</b></p><p>Note: One Time Password is Valid for only 3 Hours</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
									}
									transport.sendMail(message, function(err, info) {
											if (err) {
												User.deleteOne({ email: req.body.email}, function(error){
													if(error){
														console.log(error);
													} else {
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
																console.log(info);
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
												res.status(200).send({ auth: true, registered: true, message: 'User Successfully Registered.One Time Password has been sent to Recipient Mail that is Valid for 3 Hours. In case the Recipient Did\'t Signup within this Period. Their Account will be Automatically Deleted.'});
											}
									});
								} else {
									res.status(200).send({ auth: false, registered: false, message: "Error Saving Password" });
									console.log(error);
								}
							})
						}
					})
				} else {
					res.status(200).send({ auth: false, registered: false, message: "Paswords Do not Match with Our Records" })
				}
			} else {
				res.status(200).send({ auth: false, registered: false, message: "You are Not Authorized to Register Super Admin Users" })
			}
		} else {
			res.status(200).send({ auth: false, registered: false, message: "You are Not Authorized to Register Super Admin Users" })
		}
	})
});

app.post('/adminperms', function(req, res){
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
										res.status(200).send({ auth: true, registered: true, changed: true, message: "User has been Promoted to Super Admin" });
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
});

app.post('/superadminperms', function(req, res){
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
												})
												res.status(200).send({ auth: true, registered: true, changed: true, message: "User has been Promoted to Admin" });
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
			res.status(200).send({auth: false, registered: false, error: error, tokenuser: null});
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
					User.updateOne({ email: req.body.email }, {$set: { password: bcrypt.hashSync(newPass, 10), temppassword: null }}, function(error){
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
							res.status(200).send({ auth: true, registered: true, changed: true, message: 'Password Successfully Changed'});
						} else {
							res.status(200).send({ auth: true, registered: true, changed: false, message: 'Error While Changing password'})
						}
					})
				} else {
					res.status(200).send({ auth: true, registered: true, changed: false, message: "Wrong OTP" })
				}
			} else {
				res.status(200).send({ auth: true, registered: true, changed: false, message: "It Looks Like You Already set Your Password with OTP and Its Expired." })
			}
		} else {
			res.status(200).send({ auth: false, registered: false, changed: false, message: "Bad Request" })
		}
	})
});

app.listen(process.env.PORT || 3000, function () {
	console.log("Server is Running");
})
