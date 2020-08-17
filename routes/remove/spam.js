const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const transport = require('../../plugins/mailtransporter');
const checkOrigin = require("../../plugins/checkOrigin");
const removeSpamUser = require('../../templates/spam/removeUser.js');

//Model Imports
const User = require("../../models/user");
const SpamUser = require("../../models/spamUser");

router.post('/user', function(req, res){
  if(checkOrigin(req.headers.origin)){
    User.findOne({ email: req.body.adminuseremail }, function(error, user){
      if(user){
        bcrypt.compare(req.body.password, user.password, function(err, synced){
          if(synced){
            if(user.admin){
              User.findOne({ email: req.body.email }, function(error, resultUser){
                if(resultUser){
                  if(resultUser.superadmin){
                    res.status(200).send({
                      auth: false,
                      deleted: false,
                      message: "You are Not Authorized to Delete this User"
                    })
                  } else {
                    if(resultUser.admin){
                      res.status(200).send({
                        auth: false,
                        deleted: false,
                        message: "You are Not Authorized to Delete this User"
                      })
                    } else {
                      SpamUser.findOne({ email: req.body.email }, function(error, spamUser){
                        if(spamUser){
                          SpamUser.deleteOne({ email: req.body.email },async function(error){
                            if(error){
                              res.status(200).send({
                                auth: true,
                                deleted: false,
                                message: "Error Occured while Removing the User. Please Try Again Later."
                              })
                            } else {
                              await transport({
        												toemail: pendingResult.email,
        												subject: 'You have been Allowed to Login',
        												htmlContent: removeSpamUser(spamUser),
        											});
                              res.status(200).send({
                                auth: true,
                                deleted: true,
                                message: "Successfully Removed the User from Spam List. Now he Can Login."
                              })
                            }
                          })
                        } else {
                          res.status(200).send({
                            auth: false,
                            deleted: false,
                            message: "He is Not in Spam List"
                          })
                        }
                      })
                    }
                  }
                } else {
                  SpamUser.findOne({ email: req.body.email }, function(error, spamUser){
                    if(spamUser){
                      SpamUser.deleteOne({ email: req.body.email },async function(error){
                        if(error){
                          res.status(200).send({
                            auth: true,
                            deleted: false,
                            message: "Error Occured while Removing the User. Please Try Again Later."
                          })
                        } else {
                          await transport({
                            toemail: pendingResult.email,
                            subject: 'You have been Allowed to Login',
                            htmlContent: removeSpamUser(spamUser),
                          });
                          res.status(200).send({
                            auth: true,
                            deleted: true,
                            message: "Successfully Removed the User from Spam List. Now he Can Login."
                          })
                        }
                      })
                    } else {
                      res.status(200).send({
                        auth: false,
                        deleted: false,
                        message: "He is Not in Spam List"
                      })
                    }
                  })
                }
              })
            } else {
              res.status(200).send({
                auth: false,
                deleted: false,
                message: "You are Unauthorized"
              })
            }
          } else {
            res.status(200).send({
              auth: false,
              deleted: false,
              message: "You are Unauthorized"
            })
          }
        })
      } else {
        res.status(200).send({
          auth: false,
          deleted: false,
          message: "BAD REQUEST"
        })
      }
    })
  } else {
    res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
  }
})

router.post('/admin', function(req, res){
  if(checkOrigin(req.headers.origin)){
    User.findOne({ email: req.body.adminuseremail }, function(error, user){
      if(user){
        bcrypt.compare(req.body.password, user.password, function(err, synced){
          if(synced){
            if(user.admin){
              if(user.superadmin){
                User.findOne({ email: req.body.email }, function(error, resultUser){
                  if(resultUser){
                    if(resultUser.superadmin){
                      res.status(200).send({
                        auth: false,
                        deleted: false,
                        message: "You are Not Authorized to Delete this User"
                      })
                    } else {
                      SpamUser.findOne({ email: req.body.email }, function(error, spamUser){
                        if(spamUser){
                          SpamUser.deleteOne({ email: req.body.email },async function(error){
                            if(error){
                              res.status(200).send({
                                auth: true,
                                deleted: false,
                                message: "Error Occured while Removing the User. Please Try Again Later."
                              })
                            } else {
                              await transport({
        												toemail: pendingResult.email,
        												subject: 'You have been Allowed to Login',
        												htmlContent: removeSpamUser(spamUser),
        											});
                              res.status(200).send({
                                auth: true,
                                deleted: true,
                                message: "Successfully Removed the User from Spam List. Now he Can Login."
                              })
                            }
                          })
                        } else {
                          res.status(200).send({
                            auth: false,
                            deleted: false,
                            message: "He is Not in Spam List"
                          })
                        }
                      })
                    }
                  } else {
                    SpamUser.findOne({ email: req.body.email }, function(error, spamUser){
                      if(spamUser){
                        SpamUser.deleteOne({ email: req.body.email },async function(error){
                          if(error){
                            res.status(200).send({
                              auth: true,
                              deleted: false,
                              message: "Error Occured while Removing the User. Please Try Again Later."
                            })
                          } else {
                            await transport({
                              toemail: pendingResult.email,
                              subject: 'You have been Allowed to Login',
                              htmlContent: removeSpamUser(spamUser),
                            });
                            res.status(200).send({
                              auth: true,
                              deleted: true,
                              message: "Successfully Removed the User from Spam List. Now he Can Login."
                            })
                          }
                        })
                      } else {
                        res.status(200).send({
                          auth: false,
                          deleted: false,
                          message: "He is Not in Spam List"
                        })
                      }
                    })
                  }
                })
              } else {
                res.status(200).send({
                  auth: false,
                  deleted: false,
                  message: "You are Unauthorized"
                })
              }
            } else {
              res.status(200).send({
                auth: false,
                deleted: false,
                message: "You are Unauthorized"
              })
            }
          } else {
            res.status(200).send({
              auth: false,
              deleted: false,
              message: "You are Unauthorized"
            })
          }
        })
      } else {
        res.status(200).send({
          auth: false,
          deleted: false,
          message: "BAD REQUEST"
        })
      }
    })
  } else {
    res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
  }
})

router.post('/superadmin', function(req, res){
  if(checkOrigin(req.headers.origin)){
    User.findOne({ email: req.body.adminuseremail }, function(error, user){
      if(user){
        bcrypt.compare(req.body.password, user.password,function(err, synced){
          if(synced){
            if(user.admin){
              if(user.superadmin){
                User.findOne({ email: req.body.email }, function(error, resultUser){
                  if(resultUser){
                    SpamUser.findOne({ email: req.body.email }, function(error, spamUser){
                      if(spamUser){
                        SpamUser.deleteOne({ email: req.body.email },async function(error){
                          if(error){
                            res.status(200).send({
                              auth: true,
                              deleted: false,
                              message: "Error Occured while Removing the User. Please Try Again Later."
                            })
                          } else {
                            await transport({
                              toemail: pendingResult.email,
                              subject: 'You have been Allowed to Login',
                              htmlContent: removeSpamUser(spamUser),
                            });
                            res.status(200).send({
                              auth: true,
                              deleted: true,
                              message: "Successfully Removed the User from Spam List. Now he Can Login."
                            })
                          }
                        })
                      } else {
                        res.status(200).send({
                          auth: false,
                          deleted: false,
                          message: "He is Not in Spam List"
                        })
                      }
                    })
                  } else {
                    SpamUser.findOne({ email: req.body.email }, function(error, spamUser){
                      if(spamUser){
                        SpamUser.deleteOne({ email: req.body.email },async function(error){
                          if(error){
                            res.status(200).send({
                              auth: true,
                              deleted: false,
                              message: "Error Occured while Removing the User. Please Try Again Later."
                            })
                          } else {
                            await transport({
                              toemail: pendingResult.email,
                              subject: 'You have been Allowed to Login',
                              htmlContent: removeSpamUser(spamUser),
                            });
                            res.status(200).send({
                              auth: true,
                              deleted: true,
                              message: "Successfully Removed the User from Spam List. Now he Can Login."
                            })
                          }
                        })
                      } else {
                        res.status(200).send({
                          auth: false,
                          deleted: false,
                          message: "He is Not in Spam List"
                        })
                      }
                    })
                  }
                })
              } else {
                res.status(200).send({
                  auth: false,
                  deleted: false,
                  message: "You are Unauthorized"
                })
              }
            } else {
              res.status(200).send({
                auth: false,
                deleted: false,
                message: "You are Unauthorized"
              })
            }
          } else {
            res.status(200).send({
              auth: false,
              deleted: false,
              message: "You are Unauthorized"
            })
          }
        })
      } else {
        res.status(200).send({
          auth: false,
          deleted: false,
          message: "BAD REQUEST"
        })
      }
    })
  } else {
    res.status(200).send({ auth: false, message: "UNAUTHORIZED" })
  }
})

module.exports = router;
