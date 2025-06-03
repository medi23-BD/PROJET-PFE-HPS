const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const verifyToken = require("../middleware/authJwt");

// ➤ Liste paginée des transactions (avec recherche dynamique)
router.get("/", transactionController.getAllTransactions);

// ✅ Stats globales
router.get('/stats-globales', transactionController.getStatsGlobales);

// ✅ Stats histogramme par criticité
router.get('/stats/criticite', transactionController.getStatsParCriticite);

// ✅ Alertes
router.get('/alertes', transactionController.getAlertes);
router.get('/alertes-critiques', transactionController.getDernieresAlertesCritiques);
router.get('/alertes-par-type', transactionController.getAlertesParType);
router.get('/alertes-par-criticite', transactionController.getAlertesParCriticite);

// ➤ Analyse IA
router.post("/analyze", transactionController.analyzeTransaction);

// ➤ Compatibilité simulateur
router.post("/predict", transactionController.analyzeTransaction);

// ➤ Créer manuellement une transaction (authentifié)
router.post("/", verifyToken, transactionController.analyzeTransaction);

// ➤ Détails transaction
router.get("/:id", transactionController.getTransactionById);

// ➤ Suppression
router.delete("/:id", verifyToken, transactionController.deleteTransaction);

module.exports = router;
