const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const verifyToken = require("../middleware/authJwt");

// ✅ Créer une nouvelle transaction
router.post("/", verifyToken, transactionController.createTransaction);

// ✅ Récupérer toutes les transactions
router.get("/", verifyToken, transactionController.getAllTransactions);

// ✅ Récupérer une transaction par ID
router.get("/:id", verifyToken, transactionController.getTransactionById);

// ✅ Mettre à jour une transaction
router.put("/:id", verifyToken, transactionController.updateTransaction);

// ✅ Supprimer une transaction
router.delete("/:id", verifyToken, transactionController.deleteTransaction);

// ✅ Analyser une transaction via Flask
router.post("/predict", transactionController.analyzeTransaction);

module.exports = router;
