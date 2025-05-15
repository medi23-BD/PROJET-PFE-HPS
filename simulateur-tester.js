const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/transactions/analyze'; // ✅ Corrigé ici

// ➤ Génère des transactions calibrées
const generateTransaction = (i) => {
  const merchants = ['Marjane', 'IKEA', 'Electroplanet', 'Acima', 'LabelVie', 'BIM'];
  const villes = ['Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Tanger', 'Agadir'];

  return {
    montant: parseFloat((Math.random() * 20000).toFixed(2)),
    lieu: villes[Math.floor(Math.random() * villes.length)],
    dateTransaction: new Date().toISOString().split('T')[0],
    typeTerminal: Math.random() > 0.5 ? 'POS' : 'ATM',
    carte: 'XXXX-XXXX-XXXX-' + String(1000 + i),
    userId: null,
    merchant_name: merchants[Math.floor(Math.random() * merchants.length)],
    merchant_city: villes[Math.floor(Math.random() * villes.length)]
  };
};

const runSimulation = async () => {
  console.log('✅ Authentification réussie.');
  console.log('🚀 Simulation PRO V6 | 10 transactions calibrées...');

  const promises = [];

  for (let i = 0; i < 10; i++) {
    const transaction = generateTransaction(i + 1);

    const promise = axios.post(BASE_URL, transaction)
      .then(res => {
        console.log(`✅ Transaction ${i + 1} OK :`, res.data);
      })
      .catch(err => {
        console.error(`❌ Erreur transaction ${i + 1} :`, err.response?.data || err.message);
      });

    promises.push(promise);
  }

  await Promise.all(promises);
  console.log('✅ Simulation terminée.');
};

runSimulation();
