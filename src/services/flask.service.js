const axios = require("axios");

const FLASK_API_URL = "http://127.0.0.1:5000"; // Flask en local


exports.predictFraud = async (transactionObject) => {
  try {
    const response = await axios.post(`${FLASK_API_URL}/predict`, transactionObject, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Erreur avec Flask :", error.response?.data || error.message);
    throw error;
  }
};
