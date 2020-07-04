function returnTemplate(userDetails, post){
  return `
  <h1><center>${process.env.FRONTENDSITENAME}</center></h1>
  <p>The Following Person has Requested ${post} Previlage to ${process.env.FRONTENDSITENAME}.</p>
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
