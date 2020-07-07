function returnTemplate(userDetails) {
  return `
  <h1><center>${process.env.FRONTENDSITENAME}</center></h1>
  <p>This is Regarding Your Request to ${process.env.FRONTENDSITENAME}.</p>
  <p>It Looks Like Our Admins Have Rejected your Request.</p>
  <p>In Case You Know Any Admin, Contact Him to get Registered in this Website.</p>
  <p>Any Issues, Reply to this Mail, We Will Help Resolve Your Issue.</p>
  <p>Thanks and Regards</p>
  <p><b>${process.env.FRONTENDSITENAME}</b></p>
  `
}

module.exports = returnTemplate;
