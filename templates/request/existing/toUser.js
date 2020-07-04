function returnTemplate(userDetails, post){
  return `
  <h1><center>${process.env.FRONTENDSITENAME}</center></h1>
  <p>Dear ${userDetails.name},</p>
  <p>We have Received Your Request for ${post} Previlage in ${process.env.FRONTENDSITENAME}.Your Request is Pending Confirmation from Superadmins.Till we Process the Data, Please be Patient.</p>
  <p>Any Issues, Reply to this Mail, We Will Help Resolve Your Issue.</p>
  <p>Thanks and Regards</p>
  <p>${process.env.FRONTENDSITENAME}</p>
  `
}

module.exports = returnTemplate;
