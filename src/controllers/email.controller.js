const { sendFraudAlert } = require("../services/email.service");

/**
 * Contrôleur pour envoyer un email d'alerte de fraude
 * Appelé depuis POST /api/email/alert
 */
const triggerFraudEmail = async (req, res) => {
  try {
    const { montant, lieu, dateTransaction, typeTerminal, carte, scores, explication_shap } = req.body;

    await sendFraudAlert({
      montant,
      lieu,
      dateTransaction,
      typeTerminal,
      carte,
      scores,
      explication_shap
    });

    res.status(200).json({ message: "Email d'alerte envoyé avec succès." });
  } catch (error) {
    console.error("❌ Erreur envoi d'alerte :", error.message);
    res.status(500).json({ message: "Échec de l'envoi de l'email", error: error.message });
  }
};

module.exports = {
  triggerFraudEmail
};
