const express = require("express");
const router = express.Router();

//Model Imports
const User = require("../../models/user");
const PendingUser = require("../../models/pendingUser");

var allowedOrigin = process.env.NODE_ENV == "production" ? process.env.FRONTENDURL : "http://localhost:8080";
var allowedHost = process.env.NODE_ENV == "production" ? process.env.SITE : "http://localhost:3000";

router.post('/users', function(req, res){
	if(req.headers.origin == allowedOrigin || req.headers.origin == allowedHost){
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
	} else {
		res.status(200).send({auth: false, message: "Unauthorized"});
	}
});

router.post('/admins', function(req, res){
	if(req.headers.origin == allowedOrigin || req.headers.origin == allowedHost){
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
	} else {
		res.status(200).send({auth: false, message: "Unauthorized"});
	}
})

router.post('/superadmins', function(req, res){
	if(req.headers.origin == allowedOrigin || req.headers.origin == allowedHost){
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
	} else {
		res.status(200).send({auth: false, message: "Unauthorized"});
	}
})

module.exports = router;
