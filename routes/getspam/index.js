const express = require("express");
const router = express.Router();

//Model Imports
const User = require("../../models/user");
const SpamUser = require("../../models/spamUser");

router.post('/all', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
			if(result){
				if(result.admin){
					if(result.superadmin){
						SpamUser.find({}, function(error, result){
							if(result){
								if(result.length == 0){
									res.status(200).send({ auth: false, registered: true, message: "No Users Found" })
								} else {
									res.status(200).send({ auth: true, registered: true, users: result })
								}
							} else {
								res.status(200).send({ auth: false, registered: true, message: "No Users Found." })
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

router.post('/users', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
			if(result){
				if(result.admin){
					SpamUser.find({ post: "User"}, function(error, result){
						if(result){
							if(result.length == 0){
								res.status(200).send({ auth: false, registered: true, message: "No Users Found" })
							} else {
								res.status(200).send({ auth: true, registered: true, users: result })
							}
						} else {
							res.status(200).send({ auth: false, registered: true, message: "No Users Found." })
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

router.post('/admins', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
			if(result){
				if(result.admin){
					if(result.superadmin){
						SpamUser.find({ post: "Admin"}, function(error, result){
							if(result){
								if(result.length == 0){
									res.status(200).send({ auth: false, registered: true, message: "No Users Found" })
								} else {
									res.status(200).send({ auth: true, registered: true, users: result })
								}
							} else {
								res.status(200).send({ auth: false, registered: true, message: "No Users Found." })
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

router.post('/superadmins', function(req, res){
	User.findOne({ email: req.body.adminuseremail }, function(error, result){
			if(result){
				if(result.admin){
					if(result.superadmin){
						SpamUser.find({ post: "SuperAdmin"}, function(error, result){
							if(result){
								if(result.length == 0){
									res.status(200).send({ auth: false, registered: true, message: "No Users Found" })
								} else {
									res.status(200).send({ auth: true, registered: true, users: result })
								}
							} else {
								res.status(200).send({ auth: false, registered: true, message: "No Users Found." })
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


module.exports = router;
