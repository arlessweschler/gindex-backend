const express = require("express");
const router = express.Router();
const transport = require('../plugins/mailtransporter');
const checkOrigin = require("../plugins/checkOrigin");
const newRequestToAdminTemplate = require('../templates/request/newUser/toAdmin');
const newRequestToUserTemplate = require('../templates/request/newUser/toUser');
const existingRequestToAdminTemplate = require('../templates/request/existing/toAdmin');
const existingRequestToUserTemplate = require('../templates/request/existing/toUser');

//Model Imports
const User = require("../models/user");
const PendingUser = require("../models/pendingUser");
const SpamUser = require("../models/spamUser");
const InvitedUser = require("../models/invitedUser");

router.post('/user', function(req, res){
	if(checkOrigin(req.headers.origin)){
		PendingUser.findOne({ email: req.body.email }, function(pendingError, pendingResult){
				if(pendingResult){
					res.status(200).send({auth: false, registered: false, message: "You Have Already Requested to Join. Please Wait While We Accept." });
				} else {
					SpamUser.findOne({ email: req.body.email }, function(spamError, spamResult){
						if(spamResult){
							res.status(200).send({
								auth: false,
								registered: false,
								message: "You Already Have an Account and Also You are in our Spam List. Contact through Email to Login."
							});
						} else {
							User.findOne({ email: req.body.email }, function(error, result){
								if(result){
									res.status(200).send({
										auth: false,
										registered: false,
										message: "User already Registered with this Email."
									});
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
									User.find({ admin: true },function(error, result){
										let adminEmails = [];
										result.forEach((admin, i) => {
											adminEmails.push(admin.email)
										});
										const newPendingUser = new PendingUser({
											name: req.body.name,
											email:req.body.email,
											drive: req.body.drives,
											post: "User",
											message: req.body.message
										});
										newPendingUser.save(async function(error, doc){
											if(!error){
												adminEmails.forEach(async (email, i) => {
													await transport({
														toemail: email,
														subject: `${process.env.FRONTENDSITENAME} - Access Request`,
														htmlContent: newRequestToAdminTemplate(req.body),
													});
												});
												await transport({
													toemail: req.body.email,
													subject: 'Your Request is Pending Confirmation.',
													htmlContent: newRequestToUserTemplate(req.body),
												});
												res.status(200).send({
													auth: true,
													registered: true,
													message: "Your Request has been Sent to our Admins for Processing"
												});
											} else {
												res.status(200).send({
													auth: false,
													registered: true,
													message: "Ther's an Error Processing Your Request. Please Try Again Later."
												});
											}
										})
									})
								}
							})
						}
					})
				}
			})
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

router.post('/admin', function(req, res){
	if(checkOrigin(req.headers.origin)){
		PendingUser.findOne({ email: req.body.email, post: "Admin" }, function(error, result){
				if(result){
					res.status(200).send({
						auth: true,
						changed: false,
						message: "You are Allowed to Request only One Time.Please Wait"
					});
				} else {
					User.findOne({ email: req.body.email }, function(error, result){
						if(result){
							if(result.superadmin){
								res.status(200).send({
									auth: true,
									changed: false,
									message: "You are a Already a Super Admin"
								});
							} else {
								if(result.admin){
									res.status(200).send({
										auth: true,
										changed: false,
										message: "You are Already an Admin."
									});
								} else {
									User.find({ superadmin: true }, function(error, result){
										let adminEmails = [];
										result.forEach((admin, i) => {
											adminEmails.push(admin.email)
										});
										const newPendingUser = new PendingUser({
											name: req.body.name,
											email: req.body.email,
											drive: 0,
											post: "Admin",
											message: req.body.message
										})
										newPendingUser.save(async function(error, doc){
											if(error){
												res.status(200).send({
													auth: true,
													changed: false,
													message: "Error Sending Your Request."
												});
											} else {
												adminEmails.forEach(async (email, i) => {
													await transport({
														toemail: email,
														subject: `${process.env.FRONTENDSITENAME} - Admin Request`,
														htmlContent: existingRequestToAdminTemplate(req.body, "Admin"),
													});
												});
												await transport({
													toemail: req.body.email,
													subject: 'Your Request is Pending Confirmation.',
													htmlContent: existingRequestToUserTemplate(req.body, "Admin"),
												});
												res.status(200).send({
													auth: true,
													registered: true,
													message: "Your Request has been Sent to our Admins for Processing"
												});
											}
										})
									})
								}
							}
						} else {
							res.status(200).send({
								auth: true,
								changed: false,
								message: "BAD REQUEST"
							});
						}
					})
				}
			})
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

router.post('/superadmin', function(req, res){
	if(checkOrigin(req.headers.origin)){
		PendingUser.findOne({ email: req.body.email, post: "SuperAdmin" }, function(error, result){
				if(result){
					res.status(200).send({
						auth: true,
						changed: false,
						message: "You are Allowed to Request only One Time.Please Wait"
					});
				} else {
					User.findOne({ email: req.body.email }, function(error, result){
						if(result){
							if(result.superadmin){
								res.status(200).send({
									auth: true,
									changed: false,
									message: "You are a Already a Super Admin"
								});
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
											post: "SuperAdmin",
											drive: 0,
											message: req.body.message
										})
										newPendingUser.save(async function(error, doc){
											if(error){
												res.status(200).send({
													auth: true,
													changed: false,
													message: "Error Sending Your Request."
												});
											} else {
												adminEmails.forEach(async (email, i) => {
													await transport({
														toemail: email,
														subject: `${process.env.FRONTENDSITENAME} - Superadmin Request`,
														htmlContent: existingRequestToAdminTemplate(req.body, "Superadmin"),
													});
												});
												await transport({
													toemail: req.body.email,
													subject: 'Your Request is Pending Confirmation.',
													htmlContent: existingRequestToUserTemplate(req.body, "Superadmin"),
												});
												res.status(200).send({
													auth: true,
													registered: true,
													message: "Your Request has been Sent to our Admins for Processing"
												});
											}
										})
									})
								} else {
									res.status(200).send({
										auth: true,
										changed: false,
										message: "You Need to be a Admin to Request to be a Super Admin."
									});
								}
							}
						} else {
							res.status(200).send({
								auth: true,
								changed: false,
								message: "BAD REQUEST"
							});
						}
					})
				}
			})
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

router.use('/remove', require('./remove'));

module.exports = router;
