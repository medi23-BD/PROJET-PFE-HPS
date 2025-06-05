const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const verifyToken = require("../middleware/authJwt");

// ➤ Analyse IA
router.post("/analyze", transactionController.analyzeTransaction);
router.post("/predict", transactionController.analyzeTransaction);
router.post("/", verifyToken, transactionController.analyzeTransaction);

// routes doivent venir AVANT "/:id"
router.get("/stats-globales", transactionController.getStatsGlobales);
router.get("/stats/criticite", transactionController.getStatsParCriticite);
router.get("/alertes", transactionController.getAlertes);
router.get("/alertes-critiques", transactionController.getDernieresAlertesCritiques);
router.get("/alertes-par-type", transactionController.getAlertesParType);
router.get("/alertes-par-criticite", transactionController.getAlertesParCriticite);
router.get("/ia-performance/full", transactionController.getIaPerformanceData);

// ➤ Liste paginée & ID 
router.get("/", transactionController.getAllTransactions);
router.get("/:id", transactionController.getTransactionById);
router.delete("/:id", verifyToken, transactionController.deleteTransaction);

module.exports = router;
