require("dotenv").config();
const { sendSmsAlert } = require("./src/services/sms.service");

sendSmsAlert({
  to: "+212660025046", // Ton numéro marocain
  body: "🚨 Test depuis script direct Twilio Node.js"
});
