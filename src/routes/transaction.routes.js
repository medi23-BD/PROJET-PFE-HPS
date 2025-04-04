const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const verifyToken = require("../middleware/authJwt");

router.post("/", verifyToken, transactionController.createTransaction);
router.get("/", verifyToken, transactionController.getAllTransactions);
router.get("/:id", verifyToken, transactionController.getTransactionById);
router.put("/:id", verifyToken, transactionController.updateTransaction);
router.delete("/:id", verifyToken, transactionController.deleteTransaction);
router.post("/predict", transactionController.analyzeTransaction);

module.exports = router;
