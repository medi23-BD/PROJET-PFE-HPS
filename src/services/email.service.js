const nodemailer = require("nodemailer");

// ➕ Config de test (à adapter avec ton vrai SMTP si besoin)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // stocké dans .env
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envoie une alerte de fraude détectée par IA
 */
function sendFraudAlert({ montant, lieu, dateTransaction, typeTerminal, carte, scores }) {
  const carteMasquee = carte?.toString().slice(-4).padStart(16, "X") || "Inconnue";

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_DEST, // 📥 Met ton mail dans .env
    subject: `🚨 HPS 🚨 FRAUDE détectée sur la carte ${carteMasquee}`,
    html: `
      <h2>🚨 Alerte Fraude Bancaire</h2>
      <p><strong>Montant :</strong> ${montant} MAD</p>
      <p><strong>Lieu :</strong> ${lieu}</p>
      <p><strong>Date :</strong> ${dateTransaction}</p>
      <p><strong>Type de terminal :</strong> ${typeTerminal}</p>
      <p><strong>Carte :</strong> ${carteMasquee}</p>
      <hr>
      <p><strong> Score IA :</strong></p>
      <ul>
        <li><strong>XGBoost :</strong> ${scores?.probabilite_xgboost ?? 'N/A'}</li>
        <li><strong>MLP :</strong> ${scores?.probabilite_mlp ?? 'N/A'}</li>
        <li><strong>MSE Autoencodeur :</strong> ${scores?.mse_autoencodeur ?? 'N/A'}</li>
      </ul>
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
