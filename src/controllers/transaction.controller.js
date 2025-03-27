const db = require("../config/base-donnee");
const { sendFraudAlert } = require("../services/email.service");
const { predictFraud } = require("../services/flask.service");

// ➕ Créer une transaction simple (ancienne méthode)
function createTransaction(req, res) {
  const { montant, lieu, dateTransaction, typeTerminal, carte } = req.body;
  const userId = req.user ? req.user.userId : null;

  const sql = `
    INSERT INTO transactions (montant, lieu, dateTransaction, typeTerminal, carte, userId)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [montant, lieu, dateTransaction, typeTerminal, carte, userId], function (err) {
    if (err) {
      return res.status(500).json({ message: "Erreur de création", error: err.message });
    }

    if (montant > 3000) {
      sendFraudAlert({ montant, lieu, dateTransaction, typeTerminal, carte });
    }

    return res.status(201).json({ message: "Transaction créée", transactionId: this.lastID });
  });
}

// 🔍 Analyse IA via Flask (et sauvegarde prédiction + alerte)
async function analyzeTransaction(req, res) {
  try {
    const transactionData = req.body;

    // 🧠 Appel IA Flask
    const prediction = await predictFraud(transactionData);

    // 💾 Sauvegarde dans la BDD avec scores IA
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
      prediction.prediction,
      prediction.mse_autoencodeur,
      prediction.probabilite_xgboost,
      prediction.probabilite_mlp
    ];

    db.run(sql, values, function (err) {
      if (err) {
        return res.status(500).json({
          message: "❌ Erreur enregistrement en base",
          error: err.message
        });
      }

      // 📩 Envoi email si prédiction frauduleuse
      if (prediction.prediction === 1) {
        sendFraudAlert({
          montant: transactionData.transaction_amount,
          lieu: transactionData.merchant_city || "Inconnu",
          dateTransaction: transactionData.transaction_local_date,
          typeTerminal: transactionData.channel,
          carte: transactionData.card_number || "XXXX",
          scores: prediction
        });
      }

      return res.status(201).json({
        message: "✅ Analyse enregistrée",
        transactionId: this.lastID,
        prediction: prediction
      });
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Erreur d’analyse",
      error: error.response?.data || error.message,
    });
  }
}

// 🔍 Récupérer toutes les transactions
function getAllTransactions(req, res) {
  db.all("SELECT * FROM transactions", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Erreur", error: err.message });
    res.status(200).json(rows);
  });
}

// 🔍 Récupérer une transaction par ID
function getTransactionById(req, res) {
  db.get("SELECT * FROM transactions WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: "Erreur", error: err.message });
    if (!row) return res.status(404).json({ message: "Transaction non trouvée" });
    res.status(200).json(row);
  });
}

// 🔧 Mettre à jour une transaction
function updateTransaction(req, res) {
  const { id } = req.params;
  const { montant, lieu, dateTransaction, typeTerminal, carte } = req.body;

  const sql = `
    UPDATE transactions
    SET montant = ?, lieu = ?, dateTransaction = ?, typeTerminal = ?, carte = ?
    WHERE id = ?
  `;

  db.run(sql, [montant, lieu, dateTransaction, typeTerminal, carte, id], function (err) {
    if (err) return res.status(500).json({ message: "Erreur", error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Transaction non trouvée" });
    res.status(200).json({ message: "✅ Transaction mise à jour avec succès" });
  });
}

// ❌ Supprimer une transaction
function deleteTransaction(req, res) {
  db.run("DELETE FROM transactions WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: "Erreur", error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Transaction non trouvée" });
    res.status(200).json({ message: "✅ Transaction supprimée avec succès" });
  });
}

// ✅ Export des fonctions
module.exports = {
  createTransaction,
  analyzeTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
};
