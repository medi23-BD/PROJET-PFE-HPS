const express = require("express");
const router = express.Router();
const { triggerFraudEmail } = require("../controllers/email.controller");

// Route POST pour envoyer un email d’alerte de fraude
router.post("/alert", triggerFraudEmail);

module.exports = router;
