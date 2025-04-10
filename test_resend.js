// test_resend.js
require("dotenv").config();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

resend.emails.send({
  from: '"HPS Sécurité Département" <onboarding@resend.dev>',
  to: "hps.securite.departement@outlook.com",
  subject: "[TEST] Alerte de sécurité",
  html: "<p>Ceci est un test de Resend.</p>",
}).then(console.log).catch(console.error);
