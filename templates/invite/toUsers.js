function returnTemplate(userDetails, admin, post, message) {
  return `
  <h1><center>${process.env.FRONTENDSITENAME}</center></h1>
  <p>Dear ${userDetails.name},</p>
  <p>You Have been Invited for ${post} by Admin - ${admin} to ${process.env.FRONTENDSITENAME}.</p>
  <p> His Message to You - ${message}.</p>
  <p> If You Accept this Invite, <a href="${process.env.FRONTENDURL}">Click Here</a> to proceed.</p>
  <p>Any Issues, Reply to this Mail, We Will Help Resolve Your Issue.</p>
  <p>Thanks and Regards</p>
  <p><b>${process.env.FRONTENDSITENAME}</b></p>
  `
}

module.exports = returnTemplate;
