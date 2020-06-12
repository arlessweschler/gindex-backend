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

app.get('/', function(req, res){
  res.send("This is a DB SIte")
})

app.post('/login', function(req, res){
  User.findOne({ email: req.body.email }, function(error, result){
    if(result){
      let passwordIsValid = bcrypt.compareSync(req.body.password, result.password);
      console.log(passwordIsValid);
      if(passwordIsValid){
        const existUser = result;
        let token = jwt.sign({ id: existUser._id }, process.env.TOKENSECRET, {expiresIn: 604800});
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

app.post('/register-newuser', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
		if(result){
				if(result.admin){
					if(bcrypt.compareSync(req.body.adminpass, result.password)){
						User.findOne({ email: req.body.email }, function(error, result){
							if(result){
								res.status(200).send({ auth: true, message: "User Already Exists with this Email" });
							} else if(!result) {
								var temporaryPass = randomstring.generate({ length: 12, charset: 'alphanumeric' });
								const newUser = new User({
									name: req.body.name,
									email: req.body.email,
									temppassword: bcrypt.hashSync(temporaryPass, 10),
									role: req.body.role,
									admin: req.body.admin,
									superadmin: req.body.superAdmin
								})
								 console.log(newUser)
								 newUser.save(function(error, doc){
									 if(!error){
										 let transport = nodemailer.createTransport({
									     host: process.env.EMAILSMTP,
									     port: process.env.EMAILPORT,
											 secure: true,
									     auth: {
									        user: process.env.EMAILID,
									        pass: process.env.EMAILPASS
									     }
									 	});
									 	const message = {
									     from: process.env.EMAILID, // Sender address
									     to: req.body.email,         // List of recipients
									     subject: 'We Have Accepted Your Request.', // Subject line
									     html: `<b>As Per Your Request We have Registered you in Our Website</b><p>Now You can Login with Your Email</p><p>Here is Your One Time Password - <b>${temporaryPass}</b></p><p>One Time Password is Valid for only 24 Hours</p>` // Plain text body
									 	};
									 	transport.sendMail(message, function(err, info) {
									 	    if (err) {
													User.deleteOne({ email: req.body.email}, function(error){
														if(error){
															console.log(error);
														} else {
															const adminMessage = {
														     from: process.env.EMAILID, // Sender address
														     to: req.body.adminuseremail,         // List of recipients
														     subject: 'Don\'t Add Spam users', // Subject line
														     html: `<b>The Recipient You added now is a Spam.</b><p>You have been Restricted from Registering new Users for one Day.</p>` // Plain text body
														 	};
															console.log(adminMessage);
															User.updateOne({ email: req.body.adminuseremail }, { $set: { temprestricted: true } }, function(error){
																if(error){
																	console.log(error);
																} else {
																	console.log("Updated");
																}
															});
															transport.sendMail(adminMessage, function(error, info){
																if(error){
																	console.log(error);
																} else {
																	console.log(error);
																}
															})
															res.status(502).send({ auth: false, token: null, registered: false, message: "It Looks like the Recipient Mail is Spam." })
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
																			const deleteMessage = {
																		     from: process.env.EMAILID, // Sender address
																		     to: req.body.email,         // List of recipients
																		     subject: 'Deletion of Your Account.', // Subject line
																		     text: `<p>Your Account has been Deleted Automatically, Since You didn't Use One Time Password</p>` // Plain text body
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
													}, 30000);
									 	      res.status(200).send({ auth: true, registered: true, token: null, message: 'User Successfully Registered.One Time Password has been sent to Recipient Mail that is Valid for 24 hours. In case the Recipient Did\'t Signup within this Period. Their Account will be Automatically Deleted.'});
									 	    }
									 	});
									 } else {
										 res.status(200).send({ auth: false, registered: false, token: null });
										 console.log(error);
									 }
								 });
							}
						})
					} else {
							res.status(502).send({ auth: false, registered: false, token: null, message: "Paswords Do not Match with Our Records" })
					}
				} else {
					res.status(502).send({ auth: false, registered: false, token: null, message: "You are Not Authorized to Create Users" })
				}
		} else {
			res.status(502).send({ auth: false, registered: false, token: null, message: "You are Not Authorized to Create Users" })
		}
	})
});

// let token = jwt.sign({ id: "1231", summa: 1 }, process.env.TOKENSECRET, {expiresIn: 604800});
// console.log(token);
// let decodedToken = jwt.verify(token, process.env.TOKENSECRET);
// console.log(decodedToken);

app.post('/change-password', function(req, res){
	User.findOne({ email: req.body.email }, function(error, result){
		if(result){
			if(bcrypt.compareSync(req.body.oldpassword, result.password)){
				var newPass = req.body.newpassword;
				User.updateOne({ email: req.body.email }, {$set: { password: bcrypt.hashSync(newPass, 10), temppassword: null }}, function(error){
					if(!error){
						res.status(200).send({ auth: true, token: true, registered: true, changed: true, message: 'Password Successfully Changed'});
					} else {
						res.status(200).send({ auth: true, token: true, registered: true, changed: false, message: 'Error While Changing password'})
					}
				})
			} else {
				res.status(502).send({ auth: true, token: true, registered: true, changed: false, message: "Paswords Do not Match with Our Records" })
			}
		} else {
			res.status(502).send({ auth: false, registered: false, changed: false, message: "Bad Request" })
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
							res.status(200).send({ auth: true, token: true, registered: true, changed: true, message: 'Password Successfully Changed'});
						} else {
							res.status(200).send({ auth: true, token: true, registered: true, changed: false, message: 'Error While Changing password'})
						}
					})
				} else {
					res.status(502).send({ auth: true, token: true, registered: true, changed: false, message: "Wrong OTP" })
				}
			} else {
				res.status(502).send({ auth: true, token: true, registered: true, changed: false, message: "It Looks Like You Already set Your Password with OTP and Its Expired." })
			}
		} else {
			res.status(502).send({ auth: false, registered: false, changed: false, message: "Bad Request" })
		}
	})
});

app.listen(process.env.PORT || 3000, function () {
	console.log("Server is Running");
})
