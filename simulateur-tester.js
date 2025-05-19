
const axios = require('axios');
const hpsRules = require('./src/services/Hps.Rules'); // adapte ce chemin si besoin

const BASE_URL = 'http://localhost:3000/api/transactions/analyze';

// --- Utils réalistes --- //
const merchants = [
  'IKEA', 'Marjane', 'LabelVie', 'Acima', 'BIM', 'Jumia',
  'Shell', 'McDonalds', 'Carrefour', 'Amazon', 'Electroplanet', 'Auchan'
];
const villes = [
  'Casablanca', 'Rabat', 'Marrakech', 'Agadir', 'Tanger', 'Fès',
  'Salé', 'Kénitra', 'Oujda', 'El Jadida', 'Tetouan', 'Mohammedia'
];
const terminalTypes = ['POS', 'ATM', 'EMV'];
const entryModes = ['Chip', 'Piste'];
const riskyCountries = ['Malaisie', 'Philippines', 'Sri Lanka', 'Pérou', 'Colombie', 'Cambodia'];
const nonLiabilityCountries = ['Japon', 'Thailande', 'Népal'];
const classicHighRiskCountries = ['Chine', 'Inde', 'USA'];

function getRandomMontant(merchant) {
  const ranges = {
    'IKEA': [300, 6000], 'Marjane': [50, 2000], 'LabelVie': [60, 2000], 'Acima': [30, 800],
    'BIM': [20, 400], 'Jumia': [100, 15000], 'Shell': [100, 1500], 'McDonalds': [50, 900],
    'Carrefour': [40, 1800], 'Amazon': [100, 15000], 'Electroplanet': [100, 8000], 'Auchan': [40, 1800]
  };
  const [min, max] = ranges[merchant] || [10, 2000];
  return +(Math.random() * (max - min) + min).toFixed(2);
}
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Générateurs réalistes par règle --- //
function genAmountOver800(userId) {
  return Array.from({length: 3}).map(() => {
    const merchant = randomFrom(merchants);
    return {
      montant: 900 + Math.floor(Math.random() * 5000), // > 800
      lieu: randomFrom(villes),
      dateTransaction: new Date().toISOString(),
      typeTerminal: randomFrom(terminalTypes),
      posEntryMode: randomFrom(entryModes),
      isEcommerce: Math.random() < 0.2,
      carte: `XXXX-XXXX-XXXX-${Math.floor(1000 + Math.random()*9000)}`,
      merchant_name: merchant,
      merchant_city: randomFrom(villes),
      userId,
      hybrid_score: +(Math.random()).toFixed(4),
      proba_xgb: +(Math.random()).toFixed(4),
      mse: +(Math.random() * 0.05).toFixed(4)
    };
  });
}

function genRiskyCountry(userId) {
  return riskyCountries.map(lieu => ({
    montant: getRandomMontant(randomFrom(merchants)),
    lieu,
    dateTransaction: new Date().toISOString(),
    typeTerminal: 'POS',
    posEntryMode: randomFrom(entryModes),
    isEcommerce: Math.random() < 0.15,
    carte: `XXXX-XXXX-XXXX-${Math.floor(2000 + Math.random()*8000)}`,
    merchant_name: randomFrom(merchants),
    merchant_city: lieu,
    userId,
    hybrid_score: +(Math.random()).toFixed(4),
    proba_xgb: +(Math.random()).toFixed(4),
    mse: +(Math.random() * 0.05).toFixed(4)
  }));
}

function genNonLiabilityCountry(userId) {
  return nonLiabilityCountries.map(lieu => ({
    montant: getRandomMontant(randomFrom(merchants)),
    lieu,
    dateTransaction: new Date().toISOString(),
    typeTerminal: 'POS',
    posEntryMode: randomFrom(entryModes),
    isEcommerce: Math.random() < 0.1,
    carte: `XXXX-XXXX-XXXX-${Math.floor(3000 + Math.random()*6000)}`,
    merchant_name: randomFrom(merchants),
    merchant_city: lieu,
    userId,
    hybrid_score: +(Math.random()).toFixed(4),
    proba_xgb: +(Math.random()).toFixed(4),
    mse: +(Math.random() * 0.05).toFixed(4)
  }));
}

function genClassicInChinaIndiaUSAATM(userId) {
  return classicHighRiskCountries.flatMap(lieu => (
    Array.from({length: 2}).map(() => ({
      montant: getRandomMontant(randomFrom(merchants)),
      lieu,
      dateTransaction: new Date().toISOString(),
      typeTerminal: 'ATM',
      posEntryMode: randomFrom(entryModes),
      isEcommerce: false,
      carte: `XXXX-XXXX-XXXX-${Math.floor(3000 + Math.random()*6000)}`,
      merchant_name: randomFrom(merchants),
      merchant_city: lieu,
      userId,
      hybrid_score: +(Math.random()).toFixed(4),
      proba_xgb: +(Math.random()).toFixed(4),
      mse: +(Math.random() * 0.05).toFixed(4)
    }))
  ));
}

function genPisteOver7TPE(userId) {
  return Array.from({length: 8}).map(() => {
    const merchant = randomFrom(merchants);
    return {
      montant: getRandomMontant(merchant),
      lieu: randomFrom(villes),
      dateTransaction: new Date().toISOString(),
      typeTerminal: 'POS',
      posEntryMode: 'Piste',
      isEcommerce: Math.random() < 0.1,
      carte: `XXXX-XXXX-XXXX-${Math.floor(5000 + Math.random()*5000)}`,
      merchant_name: merchant,
      merchant_city: randomFrom(villes),
      userId,
      hybrid_score: +(Math.random()).toFixed(4),
      proba_xgb: +(Math.random()).toFixed(4),
      mse: +(Math.random() * 0.05).toFixed(4)
    };
  });
}

function genFallbackEMV(userId) {
  return Array.from({length: 2}).map(() => {
    const merchant = randomFrom(merchants);
    return {
      montant: getRandomMontant(merchant),
      lieu: randomFrom(villes),
      dateTransaction: new Date().toISOString(),
      typeTerminal: 'EMV',
      posEntryMode: 'Piste',
      isEcommerce: false,
      carte: `XXXX-XXXX-XXXX-${Math.floor(4000 + Math.random()*4000)}`,
      merchant_name: merchant,
      merchant_city: randomFrom(villes),
      userId,
      hybrid_score: +(Math.random()).toFixed(4),
      proba_xgb: +(Math.random()).toFixed(4),
      mse: +(Math.random() * 0.05).toFixed(4)
    };
  });
}

function genNightEcommerce(userId) {
  return Array.from({length: 5}).map((_, i) => {
    const merchant = randomFrom(merchants);
    let d = new Date();
    d.setHours(20 + i % 4); // 20h-23h
    return {
      montant: getRandomMontant(merchant),
      lieu: randomFrom(villes),
      dateTransaction: d.toISOString(),
      typeTerminal: 'POS',
      posEntryMode: randomFrom(entryModes),
      isEcommerce: true,
      carte: `XXXX-XXXX-XXXX-${Math.floor(6000 + Math.random()*4000)}`,
      merchant_name: merchant,
      merchant_city: randomFrom(villes),
      userId,
      hybrid_score: +(Math.random()).toFixed(4),
      proba_xgb: +(Math.random()).toFixed(4),
      mse: +(Math.random() * 0.05).toFixed(4)
    };
  });
}

function genDayEcommerce(userId) {
  return Array.from({length: 6}).map((_, i) => {
    const merchant = randomFrom(merchants);
    let d = new Date();
    d.setHours(9 + (i % 6)); // 9h-14h
    return {
      montant: getRandomMontant(merchant),
      lieu: randomFrom(villes),
      dateTransaction: d.toISOString(),
      typeTerminal: 'POS',
      posEntryMode: randomFrom(entryModes),
      isEcommerce: true,
      carte: `XXXX-XXXX-XXXX-${Math.floor(7000 + Math.random()*3000)}`,
      merchant_name: merchant,
      merchant_city: randomFrom(villes),
      userId,
      hybrid_score: +(Math.random()).toFixed(4),
      proba_xgb: +(Math.random()).toFixed(4),
      mse: +(Math.random() * 0.05).toFixed(4)
    };
  });
}

function genEcommerceOverX(userId) {
  return Array.from({length: 12}).map(() => {
    const merchant = randomFrom(merchants);
    return {
      montant: getRandomMontant(merchant),
      lieu: randomFrom(villes),
      dateTransaction: new Date().toISOString(),
      typeTerminal: 'POS',
      posEntryMode: randomFrom(entryModes),
      isEcommerce: true,
      carte: `XXXX-XXXX-XXXX-${Math.floor(8000 + Math.random()*2000)}`,
      merchant_name: merchant,
      merchant_city: randomFrom(villes),
      userId,
      hybrid_score: +(Math.random()).toFixed(4),
      proba_xgb: +(Math.random()).toFixed(4),
      mse: +(Math.random() * 0.05).toFixed(4)
    };
  });
}

function genEcommerceAmountOver448k(userId) {
  // 2 grosses transactions e-commerce pour total > 448000
  const merchant = randomFrom(merchants);
  return [
    {
      montant: 390000 + Math.floor(Math.random() * 60000),
      lieu: randomFrom(villes),
      dateTransaction: new Date().toISOString(),
      typeTerminal: 'POS',
      posEntryMode: randomFrom(entryModes),
      isEcommerce: true,
      carte: `XXXX-XXXX-XXXX-${Math.floor(9000 + Math.random()*1000)}`,
      merchant_name: merchant,
      merchant_city: randomFrom(villes),
      userId,
      hybrid_score: +(Math.random()).toFixed(4),
      proba_xgb: +(Math.random()).toFixed(4),
      mse: +(Math.random() * 0.05).toFixed(4)
    },
    {
      montant: 80000 + Math.floor(Math.random() * 20000),
      lieu: randomFrom(villes),
      dateTransaction: new Date().toISOString(),
      typeTerminal: 'POS',
      posEntryMode: randomFrom(entryModes),
      isEcommerce: true,
      carte: `XXXX-XXXX-XXXX-${Math.floor(9100 + Math.random()*900)}`,
      merchant_name: merchant,
      merchant_city: randomFrom(villes),
      userId,
      hybrid_score: +(Math.random()).toFixed(4),
      proba_xgb: +(Math.random()).toFixed(4),
      mse: +(Math.random() * 0.05).toFixed(4)
    }
  ];
}

function genInvalidCardBIN(userId) {
  return Array.from({length: 8}).map(() => {
    const merchant = randomFrom(merchants);
    return {
      montant: getRandomMontant(merchant),
      lieu: randomFrom(villes),
      dateTransaction: new Date().toISOString(),
      typeTerminal: randomFrom(terminalTypes),
      posEntryMode: randomFrom(entryModes),
      isEcommerce: false,
      carte: `XXXX-XXXX-XXXX-${Math.floor(9500 + Math.random()*500)}`,
      merchant_name: merchant,
      merchant_city: randomFrom(villes),
      rejetMotif: 'Invalid Card',
      userId,
      hybrid_score: +(Math.random()).toFixed(4),
      proba_xgb: +(Math.random()).toFixed(4),
      mse: +(Math.random() * 0.05).toFixed(4)
    };
  });
}

// --- Logging pro --- //
function logPro(index, criticite, rulesTriggered, data) {
  let msg = `✅ Transaction ${index} (${criticite}) [${rulesTriggered.join(', ')}] :`;
  console.log(msg, data);
}

// --- Hybride Criticité --- //
function getCriticiteFinale(rulesTriggered, hybrid_score = 0) {
  if (!rulesTriggered || rulesTriggered.length === 0) return 'INFO'; // Jamais au-delà de INFO sans règle HPS

  // Les règles critiques (à adapter)
  const critRules = [
    'ruleRiskyCountry', 'ruleEcommerceAmountOver448k', 'ruleAmountOver800_CRITIQUE'
    // Ajoute ici tes règles critiques
  ];
  if (rulesTriggered.some(rule => critRules.includes(rule)))
    return 'CRITIQUE';

  // Sinon, score IA élevé + règle HPS => CRITIQUE
  if (hybrid_score >= 0.65) return 'CRITIQUE';
  // Sinon, score IA moyen + règle HPS => SUSPECT
  if (hybrid_score >= 0.3) return 'SUSPECT';
  // Sinon, toute règle HPS détectée => SUSPECT
  return 'SUSPECT';
}

// --- Simulation orchestrée --- //
const stressTests = [
  {name: 'ruleAmountOver800',         gen: genAmountOver800},
  {name: 'ruleRiskyCountry',          gen: genRiskyCountry},
  {name: 'ruleNonLiabilityCountry',   gen: genNonLiabilityCountry},
  {name: 'ruleClassicInChinaIndiaUSAATM', gen: genClassicInChinaIndiaUSAATM},
  {name: 'rulePisteOver7TPE',         gen: genPisteOver7TPE},
  {name: 'ruleFallbackEMV',           gen: genFallbackEMV},
  {name: 'ruleNightEcommerce',        gen: genNightEcommerce},
  {name: 'ruleDayEcommerce',          gen: genDayEcommerce},
  {name: 'ruleEcommerceOverX',        gen: genEcommerceOverX},
  {name: 'ruleEcommerceAmountOver448k',gen: genEcommerceAmountOver448k},
  {name: 'ruleInvalidCardBIN',        gen: genInvalidCardBIN},
];

async function runStressTest() {
  let txIndex = 1;
  let promises = [];
  let userId = 1;

  for (const test of stressTests) {
    const transactions = test.gen(userId); // fixe à 1

    const rulesTriggeredBatch = transactions.map((t, idx) => {
      // Historique jusqu’à la transaction courante incluse
      const history = transactions.slice(0, idx + 1);

      // Application des règles sur l’historique jusqu’à la transaction courante
      const rulesTriggered = hpsRules.applyRules(history);

      // Criticité basée sur ces règles et le score IA
      let criticiteFinale = getCriticiteFinale(rulesTriggered, t.hybrid_score);

      // Bloc sécurité (optionnel)
      if (criticiteFinale !== 'INFO' && (!rulesTriggered || rulesTriggered.length === 0)) {
        criticiteFinale = 'INFO';
      }

      // Transaction enrichie
      const enriched = { ...t, rulesTriggered, criticiteFinale };

      const promise = axios.post(BASE_URL, enriched)
        .then(res => logPro(txIndex++, criticiteFinale, rulesTriggered, res.data))
        .catch(err => console.error(`❌ Transaction ${txIndex++} Error:`, err.response?.data || err.message));
      promises.push(promise);

      return { enriched, rulesTriggered, criticiteFinale };
    });

    // Log récap du batch pour analyse
    console.log(`\n--- Résumé pour ${test.name} ---`);
    rulesTriggeredBatch.forEach(({ enriched }, i) => {
      console.log(
        `Tx ${i + 1} | Criticité: ${enriched.criticiteFinale} | Règles: [${enriched.rulesTriggered.join(', ')}]`
      );
    });
    console.log('-----------------------------\n');
  }

  await Promise.all(promises);
  console.log('✅ Stress-test pro terminé.');
}


runStressTest();