const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Renvoie l'étiquette de criticité et la couleur associée
 */
function getCriticite(probXGBoost) {
  if (probXGBoost >= 0.9) return { label: "🚨 [CRITIQUE]", color: "#ff4c4c" };
  if (probXGBoost >= 0.75) return { label: "⚠️ [ÉLEVÉ]", color: "#ff9800" };
  if (probXGBoost >= 0.6) return { label: "🔎 [SUSPECT]", color: "#ffc107" };
  return { label: "ℹ️ [INFO]", color: "#90caf9" };
}

function sendFraudAlert({ montant, lieu, dateTransaction, typeTerminal, carte, scores }) {
  const carteMasquee = carte?.toString().slice(-4).padStart(16, "X") || "Inconnue";
  const criticite = getCriticite(scores?.probabilite_xgboost || 0);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_DEST,
    subject: `${criticite.label} ALERTE HPS FRAUDE détectée sur la carte ${carteMasquee}`,
    html: `
      <div style="background-color: ${criticite.color}; padding: 20px; border-radius: 10px; color: #fff; font-family: Arial, sans-serif;">
        <h2>${criticite.label} Alerte de fraude bancaire</h2>
        <p><strong>Montant :</strong> ${montant} MAD</p>
        <p><strong>Lieu :</strong> ${lieu}</p>
        <p><strong>Date :</strong> ${dateTransaction}</p>
        <p><strong>Type de terminal :</strong> ${typeTerminal}</p>
        <p><strong>Carte :</strong> ${carteMasquee}</p>
        <hr style="border: 1px solid #fff;">
        <p><strong>Score IA :</strong></p>
        <ul>
          <li><strong>XGBoost :</strong> ${scores?.probabilite_xgboost ?? 'N/A'}</li>
          <li><strong>MLP :</strong> ${scores?.probabilite_mlp ?? 'N/A'}</li>
          <li><strong>MSE Autoencodeur :</strong> ${scores?.mse_autoencodeur ?? 'N/A'}</li>
        </ul>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error("❌ Erreur envoi email :", error.message);
    }
    console.log("📧 Email envoyé :", info.response);
  });
}

module.exports = { sendFraudAlert };

