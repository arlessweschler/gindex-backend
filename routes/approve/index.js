const express = require("express");
const router = express.Router();
const transport = require('../../plugins/mailtransporter')
const bcrypt = require("bcrypt");
const verifiedUserTemplate = require('../../templates/register/toVerifiedUser');
const promotedUserTemplate = require('../../templates/register/toPromotedUsers');

//Model Imports
const User = require("../../models/user");
const PendingUser = require("../../models/pendingUser");
const InvitedUser = require("../../models/invitedUser");

router.post('/otp', function(req, res){
	User.findOne({ email: req.body.email }, function(error, result){
			if(result){
				var tempPassIsThere = result.temppassword != null ? true : false;
				var passNotThere = result.password == null ? true : false;
				if(tempPassIsThere && passNotThere){
					if(req.body.otp && req.body.otp != null && result.temppassword && result.temppassword != null){
						bcrypt.compare(req.body.otp, result.temppassword, function(err, synced){
							if(synced){
								var newPass = req.body.newpassword;
								bcrypt.hash(newPass, 10, function(err, hashedPass){
									if(hashedPass){
										User.updateOne({ email: req.body.email }, {$set: { password: hashedPass, temppassword: null, verified: true }},async function(error){
											if(!error){
												await transport({
													toemail: req.body.email,
													subject: 'Account Verified',
													htmlContent: verifiedUserTemplate(result),
												});
												res.status(200).send({ auth: true, registered: true, changed: true, message: `Your email ${req.body.email} has been Verified.`});
											} else {
												res.status(200).send({ auth: true, registered: true, changed: false, message: 'Error While Changing password'})
											}
										})
									} else {
										res.status(200).send({ auth: true, registered: true, changed: false, message: 'Error While Hashing Password, Please Try Again Now.'})
									}
								})
							} else {
								res.status(200).send({ auth: true, registered: true, changed: false, message: "Wrong OTP" })
							}
						})
					} else {
						res.status(200).send({ auth: false, registered: true, token: null, message: "Password is Null. Please Enter Your Password" });
					}
				} else {
					res.status(200).send({ auth: true, registered: true, changed: false, message: "It Looks Like You Already Have been Verified" })
				}
			} else {
				res.status(200).send({ auth: false, registered: false, changed: false, message: "Bad Request" })
			}
		})
});

router.post('/admin', function(req, res){
	PendingUser.findOne({ email: req.body.email, post: "Admin" }, function(error, result){
			if(result){
				User.findOne({ email: req.body.adminuseremail }, function(error, result){
					if(result){
						if(result.admin && result.superadmin){
							if(result.password != null && req.body.adminpass != null){
								bcrypt.compare(req.body.adminpass, result.password, function(err, synced){
									if(synced){
										User.findOne({ email: req.body.email }, function(error, result){
											if(result){
												if(result.superadmin){
													res.status(200).send({ auth: true, changed: false, message: "User is Already a Super Admin" });
												} else if(result.admin) {
													res.status(200).send({ auth: true, changed: false, message: "User is Already a Admin" });
												} else {
													User.updateOne({ email: req.body.email }, { $set: { admin: true, role: "Admin" } },async function(error){
														if(!error){
															await transport({
																toemail: req.body.email,
																subject: 'Account Promoted to Admin Status.',
																htmlContent: promotedUserTemplate(result, req.body.adminuseremail, "Admin"),
															});
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
								})
							} else {
								res.status(200).send({ auth: false, registered: true, token: null, message: "Password is Null. Please Enter Your Password" });
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

router.post('/superadmin', function(req, res){
	PendingUser.findOne({ email: req.body.email, post: "SuperAdmin" }, function(error, result){
			if(result){
				User.findOne({ email: req.body.adminuseremail }, function(error, result){
					if(result){
						if(result.admin && result.superadmin){
							if(result.password != null && req.body.adminpass != null){
								bcrypt.compare(req.body.adminpass, result.password, function(err, synced){
									if(synced){
										if(result.temprestricted){
											res.status(200).send({ auth: false, registered: true, changed: false, message: "You Have been Temporarily Restricted from Modifying Permissions of Users." });
										} else {
											User.findOne({ email: req.body.email }, function(error, result){
												if(result){
													if(result.admin){
														if(result.superadmin){
															res.status(200).send({ auth: true, registered: true, changed: false, message: "User is already a Super Admin" });
														} else {
															User.updateOne({ email: req.body.email }, { $set: { superadmin: true, role: "Super Admin" } },async function(error){
																if(error){
																	res.status(200).send({ auth: true, registered: true, changed: false, message: "Some Error Pinging the Servers. Try Again Later." });
																} else {
																	await transport({
																		toemail: req.body.email,
																		subject: 'Account Promoted to Super Admin Status.',
																		htmlContent: promotedUserTemplate(result, req.body.adminuseremail, "Super Admin"),
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
								})
							} else {
								res.status(200).send({ auth: false, registered: true, token: null, message: "Password is Null. Please Enter Your Password" });
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

module.exports = router;
