const axios = require('axios');

const API_URL = 'http://localhost:5000/predict'; 

const NB_TRANSACTIONS = 100;

// ✅ Criticité basée sur hybrid_score
function getCriticite(score) {
    if (score < 0.2) return 'INFO';
    if (score >= 0.2 && score < 0.3) return 'INFO';
    if (score >= 0.3 && score < 0.65) return 'SUSPECT';
    if (score >= 0.65) return 'CRITIQUE';
    return 'HORS SEUIL';
}

// ✅ Génération aléatoire d'une transaction réaliste
function generateTransaction() {
    const countries = ['Maroc', 'France', 'USA', 'Espagne', 'Nigeria', 'Emirats Arabes Unis'];
    return {
        transaction_amount: parseFloat((Math.random() * 20000).toFixed(2)),
        merchant_country: countries[Math.floor(Math.random() * countries.length)],
        card_type: 'Credit',
        card_brand: 'Visa',
        issuing_bank: 'Attijariwafa Bank',
        cvv_validation: Math.random() > 0.2,
        pos_entry_mode: 'Magstripe',
        channel: 'POS',
        is_ecommerce: Math.random() > 0.5,
        is_domestic: Math.random() > 0.1,
        risk_score: parseFloat((Math.random()).toFixed(4)),
        transaction_local_date: new Date().toISOString().split('T')[0]
    };
}

(async () => {
    console.log(' Simulation CONNECTÉE PRO V8.2 LIVE FINAL...');

    let countInfo = 0, countSuspect = 0, countCritique = 0;

    for (let i = 1; i <= NB_TRANSACTIONS; i++) {
        const transaction = generateTransaction();

        try {
            const response = await axios.post(API_URL, transaction);
            const { hybrid_score, is_fraud } = response.data;

            const criticite = getCriticite(hybrid_score);

            // ✅ Affichage résultat
            console.log(` Transaction #${i} | ${transaction.merchant_country} | ${transaction.transaction_amount} MAD`);
            console.log(`  Hybrid: ${hybrid_score.toFixed(4)} (${criticite === 'INFO' ? '🔵' : criticite === 'SUSPECT' ? '🟡' : '🔴'} ${criticite})`);

            // ✅ Compteurs pour bilan final
            if (criticite === 'INFO') countInfo++;
            else if (criticite === 'SUSPECT') countSuspect++;
            else if (criticite === 'CRITIQUE') countCritique++;

            // ✅ Alerte si critique
            if (criticite === 'CRITIQUE') {
                console.log(` ➔ Email & WhatsApp triggered`);
            }

        } catch (err) {
            console.error(`❌ Erreur API transaction #${i}:`, err.response ? err.response.data : err.message);
        }
    }

    // ✅ Résumé global
    console.log('\n📊 Bilan final :');
    console.log(`🔵 INFO     : ${countInfo} (${((countInfo / NB_TRANSACTIONS) * 100).toFixed(1)}%)`);
    console.log(`🟡 SUSPECT  : ${countSuspect} (${((countSuspect / NB_TRANSACTIONS) * 100).toFixed(1)}%)`);
    console.log(`🔴 CRITIQUE : ${countCritique} (${((countCritique / NB_TRANSACTIONS) * 100).toFixed(1)}%)`);
})();
