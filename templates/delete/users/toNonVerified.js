function returnTemplate(userDetails){
  return `
  <h1><center>${process.env.FRONTENDSITENAME}</center></h1>
  <p>Dear ${userDetails.name}</p>
  <p>This is to Inform you that your Account has been Deleted Automatically, Since You didn't Use the Sent One Time Password</p>
  <p>Any Issues, Reply to this Mail, We Will Help Resolve Your Issue.</p>
  <p>Thanks and Regards</p>
  <p><b>${process.env.FRONTENDSITENAME}</b></p>
  `
}

module.exports = returnTemplate;
