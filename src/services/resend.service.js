const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail(to, subject, html) {
  try {
    const response = await resend.emails.send({
      from:  "onboarding@resend.dev", // obligatoire si domaine non vérifié
      to,
      subject,
      html,
    });

    console.log(" Email envoyé via Resend :", response);
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error(" Erreur envoi Resend :", error);
    throw error;
  }
}

module.exports = sendMail;
