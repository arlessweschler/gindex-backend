const express = require("express");
const router = express.Router();
const checkOrigin = require("../../../plugins/checkOrigin");

//Model Imports
const User = require("../../../models/user");
const CategoryPost = require("../../../models/categoryPost");

router.post("/get", function(req, res){
  console.log("Done");
  if(checkOrigin(req.headers.origin)){
    User.findOne({ email: req.body.email }, function(error, result){
      if(result){
        CategoryPost.find({ root: req.body.root }, function(error, categories){
          if(categories){
            if(categories.length > 0){
              res.status(200).send({ auth: true, registered: true, root: req.body.root, posts: categories });
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
		res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
	}
})

module.exports = router
