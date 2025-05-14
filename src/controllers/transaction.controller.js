const db = require("../config/base-donnee");
const { sendFraudAlert } = require("../services/email.service");
const { predictFraud } = require("../services/flask.service");
const { sendWhatsAppAlert: sendWhatsAppMessage } = require("../services/whatsapp.service"); // ✅ fixé ici

/**
 * Crée une nouvelle transaction basique (sans analyse AI).
 */
function createTransaction(req, res) {
  const { montant, lieu, dateTransaction, typeTerminal, carte } = req.body;
  const userId = req.user?.userId || null;

  const sql = `
    INSERT INTO transactions (montant, lieu, dateTransaction, typeTerminal, carte, userId)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [montant, lieu, dateTransaction, typeTerminal, carte, userId], function (err) {
    if (err) return res.status(500).json({ message: "Erreur de création", error: err.message });

    // ✅ Simple alerte par seuil
    if (montant > 3000) {
      sendFraudAlert({ montant, lieu, dateTransaction, typeTerminal, carte });
    }

    return res.status(201).json({ message: "Transaction créée", transactionId: this.lastID });
  });
}

/**
 * Analyse une transaction via l'API Flask et enregistre le résultat.
 */
async function analyzeTransaction(req, res) {
  try {
    const transactionData = req.body;
    const prediction = await predictFraud(transactionData);

    const sql = `
      INSERT INTO transactions (
        montant, lieu, dateTransaction, typeTerminal, carte,
        prediction, mse, proba_xgb, proba_mlp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      transactionData.transaction_amount,
      transactionData.merchant_city || "Inconnu",
      transactionData.transaction_local_date,
      transactionData.channel,
      transactionData.card_number || "XXXX",
      prediction.is_fraud,
      prediction.details.autoencoder_score,
      prediction.details.xgb_score,
      prediction.details.mlp_score || null
    ];

    db.run(sql, values, function (err) {
      if (err) return res.status(500).json({ message: "Erreur enregistrement", error: err.message });

      // ✅ Si fraude détectée, envoie Email + WhatsApp
      if (prediction.is_fraud === 1) {
        const payload = {
          montant: transactionData.transaction_amount,
          lieu: transactionData.merchant_city || "Inconnu",
          dateTransaction: transactionData.transaction_local_date,
          typeTerminal: transactionData.channel,
          carte: transactionData.card_number || "XXXX",
          scores: {
            probabilite_xgboost: prediction.details.xgb_score,
            probabilite_mlp: prediction.details.mlp_score || 0,
            mse_autoencodeur: prediction.details.autoencoder_score
          },
          regle_hps: prediction.details.regle_hps || null
        };

        sendFraudAlert(payload);

        sendWhatsAppMessage(payload);
      }

      return res.status(201).json({
        message: "Analyse enregistrée",
        transactionId: this.lastID,
        prediction: prediction
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur analyse", error: error.message });
  }
}

/**
 * CRUD Simples
 */
function getAllTransactions(req, res) {
  db.all("SELECT * FROM transactions", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Erreur", error: err.message });
    res.status(200).json(rows);
  });
}

function getTransactionById(req, res) {
  db.get("SELECT * FROM transactions WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: "Erreur", error: err.message });
    if (!row) return res.status(404).json({ message: "Transaction non trouvée" });
    res.status(200).json(row);
  });
}

function updateTransaction(req, res) {
  const { id } = req.params;
  const { montant, lieu, dateTransaction, typeTerminal, carte } = req.body;

  const sql = `
    UPDATE transactions
    SET montant = ?, lieu = ?, dateTransaction = ?, typeTerminal = ?, carte = ?
    WHERE id = ?
  `;

  db.run(sql, [montant, lieu, dateTransaction, typeTerminal, carte, id], function (err) {
    if (err) return res.status(500).json({ message: "Erreur update", error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Transaction non trouvée" });
    res.status(200).json({ message: "Transaction mise à jour" });
  });
}

function deleteTransaction(req, res) {
  db.run("DELETE FROM transactions WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: "Erreur suppression", error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Transaction non trouvée" });
    res.status(200).json({ message: "Transaction supprimée" });
  });
}

function updateTransactionStatus(req, res) {
  const { id } = req.params;
  const { statut } = req.body;

  db.run("UPDATE transactions SET statut = ? WHERE id = ?", [statut, id], function (err) {
    if (err) return res.status(500).json({ message: "Erreur statut", error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Transaction non trouvée" });
    res.status(200).json({ message: "Statut mis à jour" });
  });
}

module.exports = {
  createTransaction,
  analyzeTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  updateTransactionStatus,
};
