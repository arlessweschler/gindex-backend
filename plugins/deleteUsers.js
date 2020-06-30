const transport = require('./mailtransporter');
const User = require("../models/user");

function deleteTimeout() {
  setInterval(() => {
    console.log("Triggered Verification Check")
    User.find({ verified: false }, function(error, result){
      if(result){
        result.forEach((user, i) => {
          const currentDate = Date.now();
          const expiryDate = user.registeredDate + (10800*1000);
          console.log(currentDate, expiryDate);
          if(currentDate > expiryDate){
            User.deleteOne({ email: user.email }, function(error){
              if(error){
                console.log(error)
              } else {
                const deleteMessage = {
                   from: `${process.env.FRONTENDSITENAME}<${process.env.EMAILID}>`,
                   to: user.email,
                   replyTo: process.env.REPLYTOMAIL,
                   subject: 'Deletion of Your Account.',
                   html: `<p>Your Account has been Deleted Automatically, Since You didn't Use the Sent One Time Password</p><p>Any Issues, Reply to this Mail, Our Admins will Contact You</p>` // Plain text body
                };
                transport.sendMail(deleteMessage, function(err, info){
                  if(err){
                    console.log(err);
                  } else {
                    console.log(info)
                  }
                })
              }
            })
          } else {
            console.log("You Got Time to Get Verified.")
          }
        });
      } else {
        console.log("All Users are Verified.")
      }
    })
  }, 10800000)
}

module.exports = deleteTimeout;
