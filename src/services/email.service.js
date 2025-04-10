const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

// Criticité dynamique (couleur + label)
function getCriticite(probXGBoost) {
  if (probXGBoost >= 0.9) return { label: "[CRITIQUE]", color: "#b71c1c" };
  if (probXGBoost >= 0.75) return { label: "[ÉLEVÉ]", color: "#ef6c00" };
  if (probXGBoost >= 0.6) return { label: "[SUSPECT]", color: "#f9a825" };
  return { label: "[INFO]", color: "#1976d2" };
}

// Logo HPS (PNG 130px en base64)
const logoBase64 = "data:image/png;base64,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";

// Fonction principale
async function sendFraudAlert({
  montant,
  lieu,
  dateTransaction,
  typeTerminal,
  carte,
  scores,
  explication_shap,
  regle_hps,
}) {
  const criticite = getCriticite(scores?.probabilite_xgboost || 0);
  const carteMasquee = carte?.toString().slice(-4).padStart(16, "*") || "Inconnue";
  const subject = `${criticite.label} Alerte HPS – Transaction suspecte sur la carte ${carteMasquee}`;

  const shapSection = Array.isArray(explication_shap) && explication_shap.length > 0
    ? `
    <div style="margin-top: 30px; border: 1px solid #ccc; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
      <h3 style="color: #444; margin-bottom: 15px;">Explication IA</h3>
      <ul style="padding-left: 20px; font-size: 14px; color: #333;">
        ${explication_shap
          .map(f =>
            `<li><strong>${f.feature}</strong> – Impact : ${f.impact} (${f.interpretation})</li>`
          )
          .join("")}
      </ul>
    </div>`
    : "";

  const regleSection = regle_hps
    ? `<p style="color: #b71c1c; font-weight: bold;">📌 Règle HPS détectée : ${regle_hps}</p>`
    : "";

  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
    <div style="max-width: 650px; margin: auto; background-color: white; border: 1px solid #ccc; border-radius: 10px; padding: 25px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${logoBase64}" alt="HPS Logo" style="width: 130px;" />
      </div>

      <h2 style="color: ${criticite.color}; border-bottom: 1px solid ${criticite.color}; padding-bottom: 10px;">
        ${subject}
      </h2>

      <p style="font-size: 15px; color: #333;">Une transaction suspecte a été détectée par le système de surveillance. Voici les détails :</p>

      <table style="width: 100%; font-size: 15px; margin-top: 10px;">
        <tr><td><strong>Montant :</strong></td><td>${montant} MAD</td></tr>
        <tr><td><strong>Lieu :</strong></td><td>${lieu}</td></tr>
        <tr><td><strong>Date :</strong></td><td>${dateTransaction}</td></tr>
        <tr><td><strong>Terminal :</strong></td><td>${typeTerminal}</td></tr>
        <tr><td><strong>Carte :</strong></td><td>${carteMasquee}</td></tr>
      </table>

      <h3 style="margin-top: 25px; color: #444;">Scores IA</h3>
      <table style="width: 100%; font-size: 15px;">
        <tr><td><strong>XGBoost :</strong></td><td>${scores?.probabilite_xgboost?.toFixed(4)}</td></tr>
        <tr><td><strong>MLP :</strong></td><td>${scores?.probabilite_mlp?.toFixed(4)}</td></tr>
        <tr><td><strong>MSE Autoencodeur :</strong></td><td>${scores?.mse_autoencodeur?.toFixed(6)}</td></tr>
      </table>

      ${regleSection}
      ${shapSection}

      <p style="margin-top: 30px; font-size: 13px; color: #777; text-align: center;">
        Cet e-mail a été généré automatiquement par le système de détection de fraudes HPS.
      </p>
    </div>
  </div>`;

  await resend.emails.send({
    from: '"HPS Sécurité Département" <onboarding@resend.dev>',
    to: "hps.securite.departement@outlook.com", // ✅ autorisé sandbox
    subject,
    html,
  });
}

module.exports = { sendFraudAlert };
