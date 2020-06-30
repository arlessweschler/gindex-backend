// Keep Site Online By Pinging every 25 Minutes.
const site = process.env.SITE;
const axios = require('axios');

function keepalive() {
  if (site) {
    try {
      setInterval(async () => {
        const data = await axios(`https://ping-pong-sn.herokuapp.com/pingback?link=${site}`);
        console.log("keep alive triggred, status: ", data.status);
      }, 1560000);
    } catch(e) {
      console.log(e);
    }
  } else {
    console.warn("Set site env var");
  }
}

module.exports = keepalive;
