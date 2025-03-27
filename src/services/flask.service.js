const axios = require("axios");

// ✅ Utilise bien le nom du service Docker (et la bonne route !)
const FLASK_API_URL = "http://flask-api:5000";

exports.predictFraud = async (transactionObject) => {
  try {
    // ✅ Envoi correct de l’objet transaction à Flask
    const response = await axios.post(`${FLASK_API_URL}/predict`, transactionObject, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Erreur avec Flask :", error.response?.data || error.message);
    throw error;
  }
};
