function returnTemplate(userDetails){
  return `
  <h1><center>${process.env.FRONTENDSITENAME}</center></h1>
  <p>Dear ${userDetails.name},</p>
  <p>We have Received Your Request for Accessing Content in ${process.env.FRONTENDSITENAME}.Your Request is Pending Confirmation from Admins.Till we Process the Data, Please be Patient.</p>
  <p>On Confirmation You will get a Email regarding Confirmation and a OTP will be Sent to Activate your Account.You have to  Activate Your Account within 3 Hours of Confirmation Mail, Otherwise your Account will be deleted Automatically.</p>
  <p>Any Issues, Reply to this Mail, We Will Help Resolve Your Issue.</p>
  <p>Thanks and Regards</p>
  <p>${process.env.FRONTENDSITENAME}</p>
  `
}

module.exports = returnTemplate;
