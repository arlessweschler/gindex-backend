const express = require("express");
const router = express.Router();
const transport = require('../../plugins/mailtransporter');
const checkOrigin = require("../../plugins/checkOrigin");
const deletePendingUserTemplate = require('../../templates/delete/pending/toAll');

//Model Imports
const User = require("../../models/user");
const PendingUser = require("../../models/pendingUser");

router.post('/user', function(req, res){
	if(checkOrigin(req.headers.origin)){
		PendingUser.findOne({ email: req.body.email, post: "User" }, function(error, pendingResult){
				if(pendingResult){
					User.findOne({ email: req.body.adminuseremail }, function(error, result){
						if(result){
							if(result.admin){
								PendingUser.deleteOne({ email: req.body.email, post: "User" },async function(error){
									if(error){
										res.status(200).send({
											auth: true,
											removed: false,
											message: "Some Error Processing Your Request. Please Try again Now."
										});
									} else {
										await transport({
											toemail: pendingResult.email,
											subject: 'Regarding Your Request',
											htmlContent: deletePendingUserTemplate(pendingResult),
										});
	                  res.status(200).send({
	                    auth: true,
	                    removed: true,
	                    message: "Request has been Deleted"
	                  });
									}
								})
							} else {
								res.status(200).send({
									auth: true,
									removed: false,
									message: "You Need to be a Admin."
								});
							}
						} else {
							res.status(200).send({
								auth: true,
								removed: false,
								message: "You are Unauthorized."
							});
						}
					})
				} else {
					res.status(200).send({
						auth: true,
						removed: false,
						message: "BAD REQUEST"
					});
				}
			})
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

router.post('/admin', function(req, res){
	if(checkOrigin(req.headers.origin)){
		PendingUser.findOne({ email: req.body.email, post: "Admin" }, function(error, pendingResult){
				if(pendingResult){
					User.findOne({ email: req.body.adminemail }, function(error, result){
						if(result){
							if(result.admin){
	              if(result.superadmin){
	                PendingUser.deleteOne({ email: req.body.email, post: "Admin" },async function(error){
	                  if(error){
	                    res.status(200).send({
	                      auth: true,
	                      removed: false,
	                      message: "Some Error Processing Your Request. Please Try again Now."
	                    });
	                  } else {
											await transport({
												toemail: pendingResult.email,
												subject: 'Regarding Your Request',
												htmlContent: deletePendingUserTemplate(pendingResult),
											});
	                    res.status(200).send({
	                      auth: true,
	                      removed: true,
	                      message: "Request has been Deleted"
	                    });
	                  }
	                })
	              } else {
	                res.status(200).send({
	  								auth: true,
	  								removed: false,
	  								message: "You Need to be a SuperAdmin."
	  							});
	              }
							} else {
								res.status(200).send({
									auth: true,
									removed: false,
									message: "You Need to be a Admin."
								});
							}
						} else {
							res.status(200).send({
								auth: true,
								removed: false,
								message: "You are Unauthorized."
							});
						}
					})
				} else {
					res.status(200).send({
						auth: true,
						removed: false,
						message: "BAD REQUEST"
					});
				}
			})
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

router.post('/superadmin', function(req, res){
	if(checkOrigin(req.headers.origin)){
		PendingUser.findOne({ email: req.body.email, post: "SuperAdmin" }, function(error, pendingResult){
				if(pendingResult){
					User.findOne({ email: req.body.adminemail }, function(error, result){
						if(result){
							if(result.admin){
	              if(result.superadmin){
	                PendingUser.deleteOne({ email: req.body.email, post: "SuperAdmin" },async function(error){
	                  if(error){
	                    res.status(200).send({
	                      auth: true,
	                      removed: false,
	                      message: "Some Error Processing Your Request. Please Try again Now."
	                    });
	                  } else {
											await transport({
												toemail: pendingResult.email,
												subject: 'Regarding Your Request',
												htmlContent: deletePendingUserTemplate(pendingResult),
											});
	                    res.status(200).send({
	                      auth: true,
	                      removed: true,
	                      message: "Request has been Deleted"
	                    });
	                  }
	                })
	              } else {
	                res.status(200).send({
	  								auth: true,
	  								removed: false,
	  								message: "You Need to be a SuperAdmin."
	  							});
	              }
							} else {
								res.status(200).send({
									auth: true,
									removed: false,
									message: "You Need to be a Admin."
								});
							}
						} else {
							res.status(200).send({
								auth: true,
								removed: false,
								message: "You are Unauthorized."
							});
						}
					})
				} else {
					res.status(200).send({
						auth: true,
						removed: false,
						message: "BAD REQUEST"
					});
				}
			})
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

module.exports = router;
