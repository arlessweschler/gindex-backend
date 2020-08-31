const express = require("express");
const router = express.Router();
const checkOrigin = require("../../../plugins/checkOrigin");
const jwtVerify = require('../../../plugins/jwtVerify');

//Model Imports
const User = require("../../../models/user");
const HeroPost = require("../../../models/heroPost");

router.post("/get", function(req, res){
  if(checkOrigin(req.headers.origin)){
    if(jwtVerify(req.headers.token)){
      User.findOne({ email: req.body.email }, function(error, result){
        if(result){
          HeroPost.find({ root: req.body.root }, function(error, heroPosts){
            if(heroPosts){
              if(heroPosts.length > 0){
                res.status(200).send({ auth: true, registered: true, root: req.body.root, posts: heroPosts });
              } else {
                res.status(200).send({ auth: false, registered: true, message: "No Posts Found in Your DB" });
              }
            } else {
              res.status(200).send({ auth: false, registered: false, message: "Error Processing Your Request" });
            }
          })
        } else {
          res.status(200).send({ auth: false, registered: false, message: "BAD REQUEST" });
        }
      })
    } else {
      res.status(200).send({ auth: false, message: "Bearer Token Not Valid" })
    }
  } else {
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

module.exports = router
