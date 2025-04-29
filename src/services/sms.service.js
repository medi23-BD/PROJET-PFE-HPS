const twilio = require("twilio");

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const client = twilio(accountSid, authToken);

async function sendSmsAlert({ to, body }) {
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_FROM, 
      to,
    });
    console.log(" SMS envoyé :", message.sid);
  } catch (error) {
    console.error(" Erreur envoi SMS :", error.message);
  }
}

module.exports = {
  sendSmsAlert,
};
