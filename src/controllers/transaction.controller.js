const db = require('../config/base-donnee');
const axios = require('axios');

// ➤ Criticité dynamique
function getCriticite(hybrid_score) {
  if (hybrid_score >= 0.65) return 'CRITIQUE';
  if (hybrid_score >= 0.3) return 'SUSPECT';
  return 'INFO';
}

// ➤ GET All Transactions : pagination + recherche
exports.getAllTransactions = (req, res) => {
  const { page = 1, limit = 10, query = '' } = req.query;
  const offset = (page - 1) * limit;
  const search = `%${query}%`;

  const sqlData = `
    SELECT * FROM transactions
    WHERE lieu LIKE ? OR statut LIKE ? OR merchant_name LIKE ?
    ORDER BY dateTransaction DESC
    LIMIT ? OFFSET ?
  `;

  const sqlCount = `
    SELECT COUNT(*) as total FROM transactions
    WHERE lieu LIKE ? OR statut LIKE ? OR merchant_name LIKE ?
  `;

  db.all(sqlData, [search, search, search, limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get(sqlCount, [search, search, search], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        transactions: rows,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      });
    });
  });
};

// ➤ POST : Analyse + Insertion
exports.analyzeTransaction = async (req, res) => {
  try {
    const data = req.body; // ✅ c'est data et pas transactionData

    const aiRequestBody = {
      transaction_amount: data.montant,
      merchant_country: 'MA',
      card_type: 'Credit',
      card_brand: 'Visa',
      issuing_bank: 'Attijariwafa Bank',
      cvv_validation: true,
      pos_entry_mode: 'Chip',
      channel: data.typeTerminal,
      is_ecommerce: false,
      is_domestic: true,
      risk_score: parseFloat((Math.random()).toFixed(4)) // tu peux envoyer un random si t'as pas mieux
    };

    const aiResponse = await axios.post('http://localhost:5000/predict', aiRequestBody);

    const { is_fraud, mse, proba_xgb, hybrid_score } = aiResponse.data;

    const criticite = getCriticite(hybrid_score);

    const sqlInsert = `
      INSERT INTO transactions (
        montant, lieu, dateTransaction, typeTerminal, carte, userId,
        prediction, mse, proba_xgb, hybrid_score, criticite, statut,
        merchant_name, merchant_city
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.montant,
      data.lieu,
      data.dateTransaction,
      data.typeTerminal,
      data.carte,
      data.userId || null,
      is_fraud,
      mse,
      proba_xgb,
      hybrid_score,
      criticite,
      'Traité',
      data.merchant_name || 'Inconnu',
      data.merchant_city || 'Inconnu'
    ];

    db.run(sqlInsert, values, function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        message: 'Transaction analysée et enregistrée',
        id: this.lastID,
        criticite,
        hybrid_score
      });
    });

  } catch (error) {
    console.error('Erreur analyse :', error.message);
    res.status(500).json({ error: 'Erreur analyse IA' });
  }
};


// ➤ GET By ID
exports.getTransactionById = (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Transaction non trouvée' });

    res.json(row);
  });
};

// ➤ DELETE
exports.deleteTransaction = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM transactions WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ message: 'Transaction supprimée', changes: this.changes });
  });
};
