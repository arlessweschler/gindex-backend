const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const checkOrigin = require("../plugins/checkOrigin");
const jwtVerify = require('../plugins/jwtVerify');

//Model Imports
const User = require("../models/user");

router.post('/generate', function(req, res){
	if(checkOrigin(req.headers.origin)){
		if(jwtVerify(req.headers.token)){
			User.findOne({ email: req.body.email }, function(error, result){
					if(result){
						let mediaToken = jwt.sign({ result }, process.env.TOKENSECRET, {expiresIn: 10800});
						res.status(200).send({ auth: true, registered: true, token: mediaToken });
					} else {
						res.status(200).send({auth: false, registered: false, tokenuser: false});
					}
				})
		} else {
			res.status(200).send({ auth: false, message: "Bearer Token Not Valid" })
		}
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

router.post('/verify', function(req, res){
	if(checkOrigin(req.headers.origin)){
		User.findOne({ email: req.body.email }, function(error, result){
				if(result){
					jwt.verify(req.body.token, process.env.TOKENSECRET, function(error, decoded){
						if(decoded){
							res.status(200).send({ auth: true, registered: true, tokenuser: decoded });
						} else {
							res.status(200).send({auth: false, registered: false, tokenuser: null});
						}
					});
				} else {
					res.status(200).send({auth: false, registered: false, tokenuser: false});
				}
			})
	} else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

module.exports = router;
