// src/routes/sms.routes.js
const express = require("express");
const router = express.Router();
const { sendSmsAlert } = require("../services/twilio.service");

router.post("/api/sms/alert", async (req, res) => {
  const { phone, message } = req.body;
  try {
    await sendSmsAlert({ to: phone, body: message });
    res.status(200).json({ message: "SMS envoyé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur envoi SMS", error: err.message });
  }
});

module.exports = router;
