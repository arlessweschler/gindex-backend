function returnTemplate(userDetails) {
  return `
  <h1><center>${process.env.FRONTENDSITENAME}</center></h1>
  <p>This is Regarding Your Invite to ${userDetails.email}</p>
  <p>It Looks Like that Person didn't Register/ Request. Please Use this Feature Wisely.</p>
  <p>Any Issues, Reply to this Mail, We Will Help Resolve Your Issue.</p>
  <p>Thanks and Regards</p>
  <p><b>${process.env.FRONTENDSITENAME}</b></p>
  `
}

module.exports = returnTemplate;
