const axios = require("axios");

async function sendMail(detailsObject) {
	try {
		var resultMessage = "";
	  await axios({
	    method: 'post',
	    url: 'https://api.sendinblue.com/v3/smtp/email',
	    headers: {
	      accept: 'application/json',
	      'content-type': 'application/json',
	      'api-key': process.env.SENDINBLUEAPI,
	    },
	    data: {
	      sender: {name: `"${process.env.FRONTENDSITENAME} - Support"`, email: process.env.EMAILID},
	      to: [{email: detailsObject.toemail}],
	      replyTo: {email: process.env.REPLYTOMAIL},
	      htmlContent: detailsObject.htmlContent,
	      subject: detailsObject.subject
	    },
	    json: true
	  }).then((response) => {
	    console.log(response.data);
			if(response.data.message){
				resultMessage = false;
			} else {
				resultMessage = true;
			}
	  })
		return resultMessage;
	} catch(e) {
	  console.log(e);
	}
}

module.exports = sendMail;
