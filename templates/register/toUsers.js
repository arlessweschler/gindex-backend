function returnTemplate(userDetails, temppass) {
  return `
  <h1><center>${process.env.FRONTENDSITENAME}</center></h1>
  <p>Dear ${userDetails.name},</p>
  <b>As Per Your Request We have Registered you in Our Website</b>
  <p>Now You can Login with Your Email</p>
  <p>Here is Your One Time Password - <b>${temppass}</b></p>
  <p>Note: One Time Password is Valid for only 3 Hours</p>
  <p>Any Issues, Reply to this Mail, We Will Help Resolve Your Issue.</p>
  <p>Thanks and Regards</p>
  <p><b>${process.env.FRONTENDSITENAME}</b></p>
  `
}

module.exports = returnTemplate;
