function returnTemplate(userDetails, admin) {
  return `
  <h1><center>${process.env.FRONTENDSITENAME}</center></h1>
  <p>Dear ${userDetails.name}</p>
  <p>Your Account has been Deleted by Super Admin - ${admin}</p>
  <p>Any Issues, Reply to this Mail, We Will Help Resolve Your Issue.</p>
  <p>Thanks and Regards</p>
  <p><b>${process.env.FRONTENDSITENAME}</b></p>
  `
}

module.exports = returnTemplate;
