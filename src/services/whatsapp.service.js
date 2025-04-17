const axios = require("axios");

/**
 * Envoie une alerte WhatsApp via CallMeBot
 * @param {Object} alertData - données de la transaction
 */
async function sendWhatsAppAlert(alertData) {
  const {
    montant,
    lieu,
    dateTransaction,
    typeTerminal,
    carte,
    scores,
    regle_hps,
  } = alertData;

  const criticite =
    scores.probabilite_xgboost >= 0.9
      ? "🔴 CRITIQUE"
      : scores.probabilite_xgboost >= 0.75
      ? "🟠 ÉLEVÉ"
      : scores.probabilite_xgboost >= 0.6
      ? "🟡 SUSPECT"
      : "🔵 INFO";

  const lastDigits = carte.toString().slice(-4).padStart(16, "*");

  const message = `
🚨 Alerte HPS – Transaction suspecte 🚨

💰 Montant : ${montant} MAD
📍 Lieu : ${lieu}
📅 Date : ${dateTransaction}
🧾 Terminal : ${typeTerminal}
💳 Carte : ${lastDigits}

📊 Scores IA :
- XGBoost : ${scores.probabilite_xgboost?.toFixed(4)}
- MLP : ${scores.probabilite_mlp?.toFixed(4)}
- MSE : ${scores.mse_autoencodeur?.toFixed(6)}

 Règle HPS : ${regle_hps || "Aucune"}
 Criticité : ${criticite}
`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=+212660025046&text=${encodeURIComponent(
    message
  )}&apikey=7853353`;

  try {
    const res = await axios.get(url);
    if (res.data.includes("Message queued")) {
      console.log("✅ Message WhatsApp envoyé avec succès.");
    } else {
      console.warn("⚠️ Échec WhatsApp :", res.data);
    }
  } catch (err) {
    console.error("❌ Erreur envoi WhatsApp :", err.message);
  }
}

module.exports = {
  sendWhatsAppAlert,
};
