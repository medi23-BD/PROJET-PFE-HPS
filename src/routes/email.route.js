const express = require("express");
const router = express.Router();
const { envoyerEmail } = require("../controllers/email.controller");

// Route POST pour envoyer un email
router.post("/send", envoyerEmail);

module.exports = router;
