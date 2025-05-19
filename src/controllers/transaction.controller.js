// controllers/transaction.controller.js

const { Transaction } = require('../models');
const { Op } = require('sequelize');

// Récupération paginée et recherche de transactions
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, query = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      [Op.or]: [
        { lieu: { [Op.like]: `%${query}%` } },
        { statut: { [Op.like]: `%${query}%` } },
        { merchant_name: { [Op.like]: `%${query}%` } }
      ]
    };

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['dateTransaction', 'DESC']]
    });

    res.json({
      transactions: rows,
      total: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Analyse/enregistrement sans recalcul, 100% simulation → stockage
const analyzeTransaction = async (req, res) => {
  try {
    const data = req.body;

    // Log de vérification (à retirer en prod)
    // console.log('Reçu côté backend:', data.rulesTriggered, data.criticiteFinale);

    const newTx = await Transaction.create({
      montant: data.montant,
      lieu: data.lieu,
      dateTransaction: data.dateTransaction,
      typeTerminal: data.typeTerminal,
      carte: data.carte,
      userId: data.userId || null,
      prediction: data.prediction ?? null,
      mse: data.mse ?? null,
      proba_xgb: data.proba_xgb ?? null,
      hybrid_score: data.hybrid_score ?? null,
      criticite: data.criticiteFinale ?? data.criticite ?? 'INFO', // La criticité calculée côté simulateur
      statut: 'Traité',
      merchant_name: data.merchant_name || 'Inconnu',
      merchant_city: data.merchant_city || 'Inconnu',
      rulesTriggered: data.rulesTriggered || []
    });

    res.json({
      message: 'Transaction analysée et enregistrée',
      id: newTx.id,
      criticite: newTx.criticite,
      hybrid_score: newTx.hybrid_score,
      proba_xgb: newTx.proba_xgb,
      mse: newTx.mse,
      rulesTriggered: newTx.rulesTriggered
    });
  } catch (error) {
    console.error('Erreur analyse :', error.message);
    res.status(500).json({ error: 'Erreur analyse/stockage transaction' });
  }
};

// Détail transaction par ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await Transaction.findByPk(id);
    if (!tx) return res.status(404).json({ error: 'Transaction non trouvée' });

    // Rendu JSON, conversion éventuelle rulesTriggered
    const data = tx.toJSON();
    if (typeof data.rulesTriggered === 'string') {
      try {
        data.rulesTriggered = JSON.parse(data.rulesTriggered);
      } catch {
        data.rulesTriggered = [];
      }
    }
    if (!data.rulesTriggered) data.rulesTriggered = [];

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Suppression transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.destroy({ where: { id } });
    res.json({ message: 'Transaction supprimée', changes: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllTransactions,
  analyzeTransaction,
  getTransactionById,
  deleteTransaction
};
