const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const verifyToken = require("../middleware/authJwt");

router.get("/", transactionController.getAllTransactions);
router.post("/", transactionController.createTransaction); 
router.get("/:id", transactionController.getTransactionById); 
router.put("/:id", verifyToken, transactionController.updateTransaction);
router.put("/:id/status", verifyToken, transactionController.updateTransactionStatus); 
router.delete("/:id", verifyToken, transactionController.deleteTransaction);
router.post("/predict", transactionController.analyzeTransaction);

module.exports = router;
