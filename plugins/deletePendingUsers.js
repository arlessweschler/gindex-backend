const transport = require('./mailtransporter');
const PendingUser = require("../models/pendingUser");
const InvitedUser = require("../models/invitedUser")

function deleteObsoleteUsers() {
  setInterval(() => {
    PendingUser.find({}, function(error, result){
      if(result){
        result.forEach((user, i) => {
          const currentTime = Date.now();
          const allowedTill = user.pendingFrom + (86400*1000);
          if(currentTime > allowedTill){
            PendingUser.deleteOne({ email: user.email }, function(error){
              if(!error){
                const deleteMessage = {
                   from: `${process.env.FRONTENDSITENAME}<${process.env.EMAILID}>`,
                   to: user.email,
                   replyTo: process.env.REPLYTOMAIL,
                   subject: 'Regarding Your Request',
                   html: `<p>This is Regarding Your Request to Glory to Heaven Content.</p><p>It Looks Like Our Admins Have Rejected your Request.</p><p>In Case You Know Any Admin, Contact Him to get Registered in this Website.</p><p><b>Thanks</b></p>` // Plain text body
                };
                transport.sendMail(deleteMessage, function(err, info){
                  if(err){
                    console.log(err);
                  } else {
                    console.log(info)
                  }
                })
              } else {
                console.log("Some Error While Trying to Deleting, Will be Deleted in Next Cycle.")
              }
            })
          } else {
            console.log("You Got Some Time Left")
          }
        });
      } else {
        console.log("No Pending Users")
      }
    })
    InvitedUser.find({}, function(error, result){
      if(result){
        result.forEach((user, i) => {
          const currentTime = Date.now();
          const allowedTill = user.pendingFrom + (86400*1000);
          if(currentTime > allowedTill){
            InvitedUser.deleteOne({ email: user.email }, function(error){
              if(!error){
                const deleteMessage = {
                   from: `${process.env.FRONTENDSITENAME}<${process.env.EMAILID}>`,
                   to: user.invitedby,
                   replyTo: process.env.REPLYTOMAIL,
                   subject: `Regarding Your Invite to ${user.email}`,
                   html: `<p>This is Regarding Your Invite to ${user.email}</p><p>It Looks Like that Person didn't Register/ Request. Please Use this Feature Wisely.</p><p><b>Thanks</b></p>` // Plain text body
                };
              } else {
                console.log("Some Error While Trying to Deleting, Will be Deleted in Next Cycle.")
              }
            })
          } else {
            console.log("You Got Some Time Left")
          }
        });

      } else {
        console.log("No Invited Users")
      }
    })
  }, 80400000)
}

module.exports = deleteObsoleteUsers;
