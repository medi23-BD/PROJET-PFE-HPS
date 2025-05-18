// ✅ VERSION SEQUELIZE DU CONTROLLER TRANSACTIONS

const { Transaction } = require('../models');
const axios = require('axios');
const businessRules = require('../services/Hps.Rules');
const { Op } = require('sequelize');

function getCriticite(hybrid_score) {
  if (hybrid_score >= 0.65) return 'CRITIQUE';
  if (hybrid_score >= 0.3) return 'SUSPECT';
  return 'INFO';
}

async function getHistoriqueTransactionsPourCarte(carte, limit = 20) {
  try {
    const historiques = await Transaction.findAll({
      where: { carte },
      order: [['dateTransaction', 'DESC']],
      limit
    });
    return historiques.map(t => t.toJSON());
  } catch (err) {
    return [];
  }
}

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

const analyzeTransaction = async (req, res) => {
  try {
    const data = req.body;

    const aiRequestBody = {
      transaction_amount: data.montant,
      merchant_country: 'MA',
      card_type: 'Credit',
      card_brand: 'Visa',
      issuing_bank: 'Attijariwafa Bank',
      cvv_validation: true,
      pos_entry_mode: data.posEntryMode || 'Chip',
      channel: data.typeTerminal,
      is_ecommerce: data.isEcommerce || false,
      is_domestic: true,
      risk_score: parseFloat((Math.random()).toFixed(4))
    };

    const aiResponse = await axios.post('http://localhost:5000/predict', aiRequestBody);
    const { is_fraud, hybrid_score, details } = aiResponse.data;
    const mse = details?.autoencoder_score ?? null;
    const proba_xgb = details?.xgb_score ?? null;

    const criticiteIA = getCriticite(hybrid_score);
    const historique = await getHistoriqueTransactionsPourCarte(data.carte, 20);
    const historiqueComplet = [...historique, data];

    let rulesTriggered = businessRules.applyRules(historiqueComplet);
    if (!Array.isArray(rulesTriggered)) rulesTriggered = [];

    let criticiteFinale;
    if (!rulesTriggered || rulesTriggered.length === 0) {
      criticiteFinale = 'INFO';
    } else if (rulesTriggered.includes('ruleAmountOver800_CRITIQUE')) {
      criticiteFinale = 'CRITIQUE';
    } else if (rulesTriggered.includes('ruleAmountOver800_SUSPECT')) {
      criticiteFinale = (criticiteIA === 'CRITIQUE') ? 'CRITIQUE' : 'SUSPECT';
    } else {
      criticiteFinale = criticiteIA;
    }

    console.log('--- DEBUG TRANSACTION ---');
    console.log('hybrid_score:', hybrid_score, 'criticiteIA:', criticiteIA);
    console.log('rulesTriggered:', rulesTriggered);
    console.log('criticiteFinale:', criticiteFinale);
    console.log('-------------------------');

    const newTx = await Transaction.create({
      montant: data.montant,
      lieu: data.lieu,
      dateTransaction: data.dateTransaction,
      typeTerminal: data.typeTerminal,
      carte: data.carte,
      userId: data.userId || null,
      prediction: is_fraud,
      mse,
      proba_xgb,
      hybrid_score,
      criticite: criticiteFinale,
      statut: 'Traité',
      merchant_name: data.merchant_name || 'Inconnu',
      merchant_city: data.merchant_city || 'Inconnu',
      rulesTriggered: JSON.stringify(rulesTriggered)
    });

    res.json({
      message: 'Transaction analysée et enregistrée',
      id: newTx.id,
      criticite: criticiteFinale,
      hybrid_score,
      proba_xgb,
      mse,
      rulesTriggered
    });
  } catch (error) {
    console.error('Erreur analyse :', error.message);
    res.status(500).json({ error: 'Erreur analyse IA' });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await Transaction.findByPk(id);
    if (!tx) return res.status(404).json({ error: 'Transaction non trouvée' });

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
