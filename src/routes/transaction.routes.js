const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const verifyToken = require("../middleware/authJwt");

// ➤ Liste paginée des transactions (avec recherche dynamique)
router.get("/", transactionController.getAllTransactions);

// route spécifique aux alertes
router.get('/alertes', transactionController.getAlertes);

// ➤ Ajouter une transaction via analyse IA (route normale)
router.post("/analyze", transactionController.analyzeTransaction);

// ➤ Route COMPATIBILITÉ pour simulateur : predict redirige vers analyze
router.post("/predict", transactionController.analyzeTransaction);

// ➤ Créer manuellement une transaction (authentifié si besoin)
router.post("/", verifyToken, transactionController.analyzeTransaction);

// ➤ Récupérer les détails d'une transaction par ID
router.get("/:id", transactionController.getTransactionById);

// ➤ Supprimer une transaction (authentifié)
router.delete("/:id", verifyToken, transactionController.deleteTransaction);

module.exports = router;
