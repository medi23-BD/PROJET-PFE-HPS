const sendMail = require("../services/resend.service");

const envoyerEmail = async (req, res) => {
  const { to, subject, html } = req.body;

  try {
    const result = await sendMail(to, subject, html);
    res.status(200).json({
      message: "Email envoyé avec succès !",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    res.status(500).json({
      message: "Échec envoi email.",
      error: error.message || error,
    });
  }
};

module.exports = { envoyerEmail };
