const express = require("express");
const router = express.Router();
const { sendWhatsAppAlert } = require("../services/whatsapp.service");

router.post("/alert", async (req, res) => {
    console.log("📩 Payload WhatsApp reçu :", req.body); // debug
    try {
      await sendWhatsAppAlert(req.body);
      res.status(200).json({ message: "WhatsApp envoyé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur WhatsApp", error: error.message });
    }
  });
  

module.exports = router;
