function returnTemplate(userDetails, admin, message){
  return `
  <h1><center>${process.env.FRONTENDSITENAME}</center></h1>
  <p>Dear ${userDetails.name},</p>
  <p>You Have been Flagged by Admin - ${admin}</p>
  <p>Reason - ${message}</p>
  <p>Hereafter You will not be able to Login Unless the Your email is Removed from Spam User List</p>
  <p>Any Issues, Reply to this Mail, We Will Help Resolve Your Issue.</p>
  <p>Thanks and Regards</p>
  <p><b>${process.env.FRONTENDSITENAME}</b></p>
  `
}

module.exports = returnTemplate;
