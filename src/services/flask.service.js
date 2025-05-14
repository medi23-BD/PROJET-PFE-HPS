const axios = require("axios");

const FLASK_API_URL = process.env.FLASK_API_URL || "http://127.0.0.1:5000"; // ✅ Configurable via .env

/**
 * Appelle l'API Flask pour prédire la fraude sur une transaction.
 * @param {Object} transaction - Données de la transaction à évaluer.
 * @returns {Promise<Object>} - Résultat de la prédiction (is_fraud, hybrid_score, details...).
 */
exports.predictFraud = async (transaction) => {
  try {
    const response = await axios.post(
      `${FLASK_API_URL}/predict`,
      transaction,
      { headers: { "Content-Type": "application/json" }, timeout: 5000 }
    );

    if (response.status === 200 && response.data) {
      return response.data;
    } else {
      throw new Error(`Réponse inattendue de Flask : ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Erreur API Flask :", error.response?.data || error.message);

    // Remonter une erreur claire au backend Node.js
    throw new Error(`Flask API Error: ${error.response?.data?.error || error.message}`);
  }
};
