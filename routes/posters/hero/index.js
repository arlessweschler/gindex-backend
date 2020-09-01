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

router.post("/set", function(req, res){
  if(checkOrigin(req.headers.origin)){
    if(jwtVerify(req.headers.token)){
      User.findOne({ email: req.body.email }, function(error, result){
        if(result){
          if(result.admin){
            HeroPost.findOne({ _id: req.body.postId }, function(error, heropost){
              if(heropost){
                HeroPost.updateOne({ _id: req.body.postId }, { $set: req.body.post }, function(error){
                  if(!error){
                    console.log("Updated Posts");
                    res.status(200).send({ auth: true, registered: true, changed: true, message: "Successfully Updated Posts" });
                  } else {
                    console.log("Error Changing Settings");
                    res.status(200).send({ auth: true, registered: true, changed: false, message: "Error Updating Posts" });
                  }
                })
              } else {
                let reqPost = req.body.post;
                const newPost = new HeroPost({
                  root: reqPost.root,
                  title: reqPost.title,
                  subtitle: reqPost.subtitle,
                  poster: reqPost.poster,
                  link: reqPost.link
                })
                newPost.save(function(error, doc){
                  if(!error){
                    res.status(200).send({ auth: true, registered: true, changed: true, message: "Successfully Added Posts" });
                  } else {
                    res.status(200).send({ auth: true, registered: true, changed: false, message: "Error Saving New Post" });
                  }
                })
              }
            })
          } else {
            res.status(200).send({ auth: false, registered: false, message: "You dont Have Sufficient Permission to Access this Api." });
          }
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

router.post("/delete", function(req, res){
  if(checkOrigin(req.headers.origin)){
    if(jwtVerify(req.headers.token)){
      User.findOne({ email: req.body.email }, function(error, result){
        if(result){
          if(result.admin){
            HeroPost.findOne({ _id: req.body.postId }, function(error, heropost){
              if(heropost){
                HeroPost.deleteOne({ _id: req.body.postId }, function(error){
                  if(!error){
                    res.status(200).send({ auth: true, registered: true, message: "Your Post has been Successfully Deleted" });
                  } else {
                    res.status(200).send({ auth: false, registered: true, message: "Error While Deleting Post" });
                  }
                })
              } else {
                res.status(200).send({ auth: false, registered: true, message: "No Post Found with this ID" });
              }
            })
          } else {
            res.status(200).send({ auth: false, registered: false, message: "You dont Have Sufficient Permission to Access this Api." });
          }
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
