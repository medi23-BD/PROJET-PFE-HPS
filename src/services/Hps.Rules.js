const riskyCountries = ['Malaisie', 'Philippines', 'Sri Lanka', 'Pérou', 'Colombie', 'Antigua et Barbade', 'Trinidade et Tobaggo', 'République Dominicaine', 'Cambodia', 'Indonésia'];
const nonLiabilityCountries = ['Japon', 'Thailande', 'Népal'];
const classicHighRiskCountries = ['Chine', 'Inde', 'USA'];
const blacklistedMerchants = ['BadShop', 'FraudElectro', 'FakeStore'];
const highRiskMCC = [6011, 7995, 4829, 6211];

// 🔒 Sécurisation de la lecture de l'heure
function getHour(d) {
  try {
    return new Date(d).getHours();
  } catch (e) {
    return -1;
  }
}

function timeDiffMin(a, b) {
  return Math.abs(new Date(a) - new Date(b)) / 60000;
}

const rules = {
  ruleAmountOver800_SUSPECT(transactions) {
    return transactions.some(t => t.montant > 800 && t.montant < 3000);
  },

  ruleAmountOver800_CRITIQUE(transactions) {
    return transactions.some(t =>
      t.montant >= 3000
      || (t.montant > 800 && riskyCountries.includes(t.lieu))
      || (t.montant > 800 && t.isEcommerce && (getHour(t.dateTransaction) < 7 || getHour(t.dateTransaction) >= 18))
    );
  },

  ruleRiskyCountry(transactions) {
    return transactions.filter(t => riskyCountries.includes(t.lieu)).length >= 3;
  },

  ruleNonLiabilityCountry(transactions) {
    return transactions.filter(t => nonLiabilityCountries.includes(t.lieu)).length >= 2;
  },

  ruleClassicInChinaIndiaUSAATM(transactions) {
    return transactions.filter(t => classicHighRiskCountries.includes(t.lieu) && t.typeTerminal === 'ATM').length >= 2;
  },

  rulePisteOver7TPE(transactions) {
    return transactions.filter(t => t.posEntryMode === 'Piste' && t.typeTerminal === 'POS').length > 7;
  },

  ruleFallbackEMV(transactions) {
    return transactions.filter(t => t.posEntryMode === 'Piste' && t.typeTerminal === 'EMV').length >= 2;
  },

  ruleNightEcommerce(transactions) {
    return transactions.filter(t => t.isEcommerce && (getHour(t.dateTransaction) >= 18 || getHour(t.dateTransaction) < 7)).length >= 3;
  },

  ruleDayEcommerce(transactions) {
    return transactions.filter(t => t.isEcommerce && getHour(t.dateTransaction) >= 7 && getHour(t.dateTransaction) < 18).length >= 5;
  },

  ruleEcommerceOverX(transactions, limit = 10) {
    return transactions.filter(t => t.isEcommerce).length > limit;
  },

  ruleEcommerceAmountOver448k(transactions) {
    const total = transactions.filter(t => t.isEcommerce).reduce((sum, t) => sum + t.montant, 0);
    return total > 448000;
  },

  ruleInvalidCardBIN(transactions) {
    return transactions.filter(t => t.rejetMotif === 'Invalid Card').length > 6;
  },

  ruleHighRiskMCC(transactions) {
    return transactions.filter(t => highRiskMCC.includes(t.merchant_category_code)).length >= 3;
  },

  ruleBlacklistedMerchant(transactions) {
    return transactions.some(t => blacklistedMerchants.includes(t.merchant_name));
  },

  ruleImpossibleTravel(transactions) {
    for (let i = 1; i < transactions.length; i++) {
      const prev = transactions[i - 1];
      const curr = transactions[i];
      if (prev.lieu !== curr.lieu && timeDiffMin(prev.dateTransaction, curr.dateTransaction) < 60) {
        return true;
      }
    }
    return false;
  },

  ruleSplittedAmount(transactions) {
    const slice = transactions.filter(t => t.montant >= 700 && t.montant < 800);
    if (slice.length < 3) return false;
    slice.sort((a, b) => new Date(a.dateTransaction) - new Date(b.dateTransaction));
    for (let i = 0; i < slice.length - 2; i++) {
      if (timeDiffMin(slice[i].dateTransaction, slice[i + 2].dateTransaction) < 60) return true;
    }
    return false;
  },

  ruleMerchantBehaviorChange(transactions) {
    const last5 = transactions.slice(-5);
    return last5.filter(t => t.isEcommerce).length >= 4 && transactions.filter(t => t.isEcommerce).length < 10;
  },

  ruleMultiCardSameTPE(transactions) {
    const tpes = {};
    transactions.forEach(t => {
      if (!tpes[t.terminal_id]) tpes[t.terminal_id] = new Set();
      tpes[t.terminal_id].add(t.carte);
    });
    return Object.values(tpes).some(set => set.size >= 3);
  },

  ruleCardOnMultiTPE(transactions) {
    const grouped = {};
    transactions.forEach(t => {
      const dateKey = (typeof t.dateTransaction === 'string'
        ? t.dateTransaction
        : new Date(t.dateTransaction).toISOString()
      ).substr(0, 13);

      const key = `${t.carte}_${dateKey}`;
      if (!grouped[key]) grouped[key] = new Set();
      grouped[key].add(t.terminal_id);
    });
    return Object.values(grouped).some(set => set.size >= 3);
  }
};

// --- Application des règles --- //
function applyRules(transactions) {
  const triggered = [];
  if (rules.ruleAmountOver800_CRITIQUE(transactions)) triggered.push('ruleAmountOver800_CRITIQUE');
  else if (rules.ruleAmountOver800_SUSPECT(transactions)) triggered.push('ruleAmountOver800_SUSPECT');
  if (rules.ruleRiskyCountry(transactions)) triggered.push('ruleRiskyCountry');
  if (rules.ruleNonLiabilityCountry(transactions)) triggered.push('ruleNonLiabilityCountry');
  if (rules.ruleClassicInChinaIndiaUSAATM(transactions)) triggered.push('ruleClassicInChinaIndiaUSAATM');
  if (rules.rulePisteOver7TPE(transactions)) triggered.push('rulePisteOver7TPE');
  if (rules.ruleFallbackEMV(transactions)) triggered.push('ruleFallbackEMV');
  if (rules.ruleNightEcommerce(transactions)) triggered.push('ruleNightEcommerce');
  if (rules.ruleDayEcommerce(transactions)) triggered.push('ruleDayEcommerce');
  if (rules.ruleEcommerceOverX(transactions)) triggered.push('ruleEcommerceOverX');
  if (rules.ruleEcommerceAmountOver448k(transactions)) triggered.push('ruleEcommerceAmountOver448k');
  if (rules.ruleInvalidCardBIN(transactions)) triggered.push('ruleInvalidCardBIN');
  if (rules.ruleHighRiskMCC(transactions)) triggered.push('ruleHighRiskMCC');
  if (rules.ruleBlacklistedMerchant(transactions)) triggered.push('ruleBlacklistedMerchant');
  if (rules.ruleImpossibleTravel(transactions)) triggered.push('ruleImpossibleTravel');
  if (rules.ruleSplittedAmount(transactions)) triggered.push('ruleSplittedAmount');
  if (rules.ruleMerchantBehaviorChange(transactions)) triggered.push('ruleMerchantBehaviorChange');
  if (rules.ruleMultiCardSameTPE(transactions)) triggered.push('ruleMultiCardSameTPE');
  if (rules.ruleCardOnMultiTPE(transactions)) triggered.push('ruleCardOnMultiTPE');
  return triggered;
}

// --- Criticité finale hybride --- //
function getCriticiteFromRules(transactions) {
  const rulesResult = applyRules(transactions);
  const CRITIQUE = [
    'ruleAmountOver800_CRITIQUE',
    'ruleRiskyCountry',
    'ruleImpossibleTravel',
    'ruleSplittedAmount',
    'ruleHighRiskMCC',
    'ruleBlacklistedMerchant',
    'ruleEcommerceAmountOver448k'
  ];
  if (rulesResult.some(rule => CRITIQUE.includes(rule))) return 'CRITIQUE';

  const SUSPECT = [
    'ruleAmountOver800_SUSPECT',
    'ruleDayEcommerce',
    'ruleNightEcommerce',
    'ruleFallbackEMV',
    'ruleNonLiabilityCountry',
    'ruleClassicInChinaIndiaUSAATM',
    'rulePisteOver7TPE',
    'ruleEcommerceOverX',
    'ruleMerchantBehaviorChange',
    'ruleMultiCardSameTPE',
    'ruleCardOnMultiTPE',
    'ruleInvalidCardBIN'
  ];
  if (rulesResult.some(rule => SUSPECT.includes(rule))) return 'SUSPECT';

  return 'INFO';
}

module.exports = {
  ...rules,
  applyRules,
  getCriticiteFromRules
};
