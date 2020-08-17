const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const transport = require('../plugins/mailtransporter');
const checkOrigin = require("../plugins/checkOrigin");
const spamUserTemplate = require('../templates/spam/toAll.js');

//Model Imports
const User = require("../models/user");
const SpamUser = require("../models/spamUser");

router.post('/user', function(req, res){
	if(checkOrigin(req.headers.origin)){
		User.findOne({ email: req.body.adminuseremail }, function(error, result){
				if(result){
					if(result.admin){
						bcrypt.compare(req.body.adminpass, result.password, function(err, synced){
							if(synced){
								User.findOne({ email: req.body.email }, function(error, result){
									if(result){
										const spamUser = new SpamUser({
											name: result.name,
											email: result.email,
											post: "User",
											flaggedby: req.body.adminuseremail,
											reason: req.body.message
										})
										spamUser.save(async function(error, doc){
											if(error){
												res.status(200).send({ auth: true, registered: false, message: "Error Processing Request. Try Again Later" });
											} else {
												await transport({
													toemail: req.body.email,
													subject: 'You Have Been Flagged',
													htmlContent: spamUserTemplate(doc, req.body.adminuseremail, req.body.message),
												});
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
						})
					} else {
						res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
					}
				} else {
					res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
				}
			})
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

router.post('/quickadd', function(req, res){
	if(checkOrigin(req.headers.origin)){
		User.findOne({ email: req.body.adminuseremail }, function(error, result){
				if(result){
					if(result.admin){
						if(result.superadmin){
							User.findOne({ email: req.body.email }, function(error, result){
								if(result){
									const spamUser = new SpamUser({
										name: result.name,
										email: req.body.email,
										post: "User",
										flaggedby: req.body.adminuseremail,
										reason: "Quick Spam Handle - From Frontend"
									})
									spamUser.save(async function(error, doc){
										if(error){
											res.status(200).send({ auth: true, registered: false, message: "Error Processing Request. Try Again Later" });
										} else {
											await transport({
												toemail: req.body.email,
												subject: 'You Have Been Flagged',
												htmlContent: spamUserTemplate(doc, req.body.adminuseremail, "Quick Spam Handle - From Frontend"),
											});
											res.status(200).send({ auth: true, registered: true, message: 'User has Been Added to Spam User Database.'});
										}
									})
								} else {
									const spamUser = new SpamUser({
										name: "Unregistered User",
										email: req.body.email,
										post: "User",
										flaggedby: req.body.adminuseremail,
										reason: "Quick Spam Handle - From Frontend"
									})
									spamUser.save(async function(error, doc){
										if(error){
											res.status(200).send({ auth: true, registered: false, message: "Error Processing Request. Try Again Later" });
										} else {
											await transport({
												toemail: req.body.email,
												subject: 'You Have Been Flagged',
												htmlContent: spamUserTemplate(doc, req.body.adminuseremail, "Quick Spam Handle - From Frontend"),
											});
											res.status(200).send({ auth: true, registered: true, message: 'User has Been Added to Spam User Database.'});
										}
									})
								}
							})
						} else {

						}
					} else {
						res.status(200).send({ auth: false, registered: true, message: "You are Unauthorized" })
					}
				} else {
					res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" })
				}
			})
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

router.post('/admin', function(req, res){
	if(checkOrigin(req.headers.origin)){
		User.findOne({ email: req.body.adminuseremail }, function(error, result){
				if(result){
					if(result.admin){
						if(result.superadmin){
							bcrypt.compare(req.body.adminpass, result.password, function(err, synced){
								if(synced){
									User.findOne({ email: req.body.email }, function(error, result){
										if(result){
											const spamUser = new SpamUser({
												name: result.name,
												email: result.email,
												post: "Admin",
												flaggedby: req.body.adminuseremail,
												reason: req.body.message
											})
											spamUser.save(async function(error, doc){
												if(error){
													res.status(200).send({ auth: true, registered: false, message: "Error Processing Request. Try Again Later" });
												} else {
													await transport({
														toemail: req.body.email,
														subject: 'You Have Been Flagged',
														htmlContent: spamUserTemplate(doc, req.body.adminuseremail, req.body.message),
													});
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
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

router.post('/superadmin', function(req, res){
	if(checkOrigin(req.headers.origin)){
		User.findOne({ email: req.body.adminuseremail }, function(error, result){
				if(result){
					if(result.admin){
						if(result.superadmin){
							bcrypt.compare(req.body.adminpass, result.password, function(err, synced){
								if(synced){
									User.findOne({ email: req.body.email }, function(error, result){
										if(result){
											const spamUser = new SpamUser({
												name: result.name,
												email: result.email,
												post: "SuperAdmin",
												flaggedby: req.body.adminuseremail,
												reason: req.body.message
											})
											spamUser.save(async function(error, doc){
												if(error){
													res.status(200).send({ auth: true, registered: false, message: "Error Processing Request. Try Again Later" });
												} else {
													await transport({
														toemail: req.body.email,
														subject: 'You Have Been Flagged',
														htmlContent: spamUserTemplate(doc, req.body.adminuseremail, req.body.message),
													});
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
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

router.use('/remove', require('./remove/spam'));

module.exports = router;
