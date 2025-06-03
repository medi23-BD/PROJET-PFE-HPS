const { Transaction } = require('../models');
const { Op } = require('sequelize');

// 🔎 Calcule de criticité final (hybride)
function getCriticiteFinale(rulesTriggered = [], hybrid_score = 0) {
  if (!rulesTriggered || rulesTriggered.length === 0) return 'INFO';

  const critRules = ['ruleRiskyCountry', 'ruleEcommerceAmountOver448k', 'ruleAmountOver800_CRITIQUE'];
  if (rulesTriggered.some(rule => critRules.includes(rule))) return 'CRITIQUE';

  if (hybrid_score >= 0.65) return 'CRITIQUE';
  if (hybrid_score >= 0.3) return 'SUSPECT';
  return 'SUSPECT'; // fallback si règle présente
}

// 🔍 Récupération paginée et filtrée (criticité + recherche)
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', criticite = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      [Op.and]: [
        criticite ? { criticite: { [Op.in]: criticite.split(',') } } : {},
        {
          [Op.or]: [
            { lieu: { [Op.like]: `%${q}%` } },
            { statut: { [Op.like]: `%${q}%` } },
            { merchant_name: { [Op.like]: `%${q}%` } }
          ]
        }
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
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🧠 Enregistrement d'une transaction analysée (simulation)
const analyzeTransaction = async (req, res) => {
  try {
    const data = req.body;

    // 💡 Calcul automatique de la criticité finale
    const criticiteCalculee = getCriticiteFinale(data.rulesTriggered, data.hybrid_score);

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
      criticite: criticiteCalculee,
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

// 🔍 Récupération transaction par ID
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

const getStatsGlobales = async (req, res) => {
  try {
    const stats = {
      totalTransactions: await Transaction.count(),
      totalFraudeCritique: await Transaction.count({ where: { criticite: 'CRITIQUE' } }),
      totalFraudeSuspect: await Transaction.count({ where: { criticite: 'SUSPECT' } }),
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques globales' });
  }
};

// ❌ Suppression
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.destroy({ where: { id } });
    res.json({ message: 'Transaction supprimée', changes: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔔 Optionnel : endpoint dédié pour alertes
const getAlertes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Transaction.findAndCountAll({
      where: {
        criticite: { [Op.in]: ['CRITIQUE', 'SUSPECT'] }
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['dateTransaction', 'DESC']]
    });

    res.json({
      transactions: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Erreur fetch alertes :', err.message);
    res.status(500).json({ error: 'Erreur récupération alertes' });
  }
};
const getDernieresAlertesCritiques = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const alertes = await Transaction.findAll({
      where: { criticite: 'CRITIQUE' },
      order: [['dateTransaction', 'DESC']],
      limit,
    });
    res.json(alertes);
  } catch (err) {
    console.error('Erreur fetch alertes critiques :', err.message);
    res.status(500).json({ error: 'Erreur récupération alertes critiques' });
  }
};

const getAlertesParCriticite = async (req, res) => {
  try {
    const criticite = req.query.criticite || 'CRITIQUE';
    const limit = parseInt(req.query.limit) || 5;

    const alertes = await Transaction.findAll({
      where: { criticite },
      order: [['dateTransaction', 'DESC']],
      limit
    });

    res.json(alertes);
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération alertes par criticité' });
  }
};


const getAlertesParType = async (req, res) => {
  try {
    const { criticite, limit = 5 } = req.query;
    const alertes = await Transaction.findAll({
      where: { criticite },
      order: [['dateTransaction', 'DESC']],
      limit: parseInt(limit),
    });
    res.json(alertes);
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération alertes par type' });
  }
};

// 🔢 Comptage groupé par criticité
const getStatsParCriticite = async (req, res) => {
  try {
    const stats = await Transaction.findAll({
      attributes: [
        'criticite',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['criticite']
    });

    res.json(stats);
  } catch (err) {
    console.error('Erreur stats criticité:', err);
    res.status(500).json({ error: 'Erreur récupération stats criticité' });
  }
};




module.exports = {
  getAllTransactions,
  analyzeTransaction,
  getTransactionById,
  deleteTransaction,
  getDernieresAlertesCritiques,
  getAlertesParType,
  getAlertesParCriticite,
  getStatsParCriticite,
  getStatsGlobales,
  getAlertes
};
