const axios = require("axios");

const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY || "7853353";
const PHONE_NUMBER = process.env.ALERT_PHONE_NUMBER || "+212660025046";

async function sendWhatsAppAlert({
  montant,
  lieu,
  dateTransaction,
  typeTerminal,
  carte,
  scores,
  regle_hps,
}) {
  const criticite =
    scores?.probabilite_xgboost >= 0.9
      ? "🔴 CRITIQUE"
      : scores?.probabilite_xgboost >= 0.75
      ? "🟠 ÉLEVÉ"
      : scores?.probabilite_xgboost >= 0.6
      ? "🟡 SUSPECT"
      : "🔵 INFO";

  const lastDigits = carte?.toString().slice(-4).padStart(16, "*") || "Inconnue";

  const message = `
🚨 Alerte HPS – Transaction suspecte 🚨

💰 Montant : ${montant} MAD
📍 Lieu : ${lieu}
📅 Date : ${dateTransaction}
🧾 Terminal : ${typeTerminal}
💳 Carte : ${lastDigits}

📊 Scores IA :
- XGBoost : ${scores?.probabilite_xgboost?.toFixed(4)}
- MLP : ${scores?.probabilite_mlp?.toFixed(4)}
- MSE : ${scores?.mse_autoencodeur?.toFixed(6)}

📌 Règle HPS : ${regle_hps || "Aucune"}
❗ Criticité : ${criticite}
`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${PHONE_NUMBER}&text=${encodeURIComponent(
    message
  )}&apikey=${CALLMEBOT_API_KEY}`;

  try {
    const res = await axios.get(url);
    if (res.data.includes("Message queued")) {
      console.log("✅ WhatsApp envoyé avec succès.");
    } else {
      console.warn("⚠️ WhatsApp échec :", res.data);
    }
  } catch (err) {
    console.error("❌ Erreur WhatsApp :", err.message);
  }
}

module.exports = { sendWhatsAppAlert };
