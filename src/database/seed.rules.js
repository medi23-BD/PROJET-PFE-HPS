const db = require('../models');

async function seedRules() {
  await db.sequelize.sync();

  await db.Rule.bulkCreate([
    {
      id: 'ruleAmountOver800',
      label: 'Montant > 800 MAD',
      description: 'Détecte les montants supérieurs à 800 MAD',
      active: true,
    },
    {
      id: 'ruleLocationMismatch',
      label: 'Pays ≠ localisation habituelle',
      description: 'Pays de la transaction différent du pays habituel',
      active: true,
    },
    {
      id: 'ruleMerchantBlacklisted',
      label: 'Merchant blacklisté',
      description: 'Transaction vers un marchand interdit',
      active: false,
    },
    {
      id: 'ruleRapidSuccessiveTx',
      label: 'Transactions rapides successives',
      description: 'Plusieurs transactions dans un intervalle court',
      active: true,
    }
  ]);

  console.log('✅ Règles insérées');
  process.exit();
}

seedRules();
