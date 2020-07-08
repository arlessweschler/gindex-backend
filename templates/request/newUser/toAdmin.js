function returnTemplate(userDetails) {
  return `
  <h1><center>${process.env.FRONTENDSITENAME}</center></h1>
  <p>The Following Person has Requested Access to ${process.env.FRONTENDSITENAME} Content.</p>
  <p>If You Know him it is Well and Good, but Don't Accept Unwanted Request and Bloat the Website</p>
  <b><u>Details:</u></b>
  <p>Name: - <b>${userDetails.name}</b></p>
  <p>Email - <b>${userDetails.email}</b></p>
  <p>Message from Recipient - <b>${userDetails.message}</b></p>
  <p>Any Issues, Reply to this Mail, We Will Help Resolve Your Issue.</p>
  <p>Thanks and Regards</p>
  <p><b>${process.env.FRONTENDSITENAME}</b></p>
  `
}

module.exports = returnTemplate;
