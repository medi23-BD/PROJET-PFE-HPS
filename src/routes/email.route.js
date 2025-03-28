const express = require('express');
const router = express.Router();
const { sendFraudAlert } = require('../services/email.service'); // adapter si ton chemin est différent

router.post('/alert', (req, res) => {
  const alertData = req.body;

  try {
    sendFraudAlert(alertData);
    res.status(200).json({ message: 'Alerte email envoyée ✅' });
  } catch (error) {
    console.error("Erreur envoi alerte :", error.message);
    res.status(500).json({ error: 'Erreur lors de l’envoi d’alerte' });
  }
});

module.exports = router;
