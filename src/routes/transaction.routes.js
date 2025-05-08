const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const verifyToken = require("../middleware/authJwt");
const { Op, fn, col, where } = require("sequelize");
const Transaction = require("../models/Transaction");

//  ✅ Route de recherche dynamique insensible à la casse
router.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ message: "Requête manquante" });

  try {
    const results = await Transaction.findAll({
      where: where(
        fn("LOWER", col("lieu")),
        {
          [Op.like]: `%${query.toLowerCase()}%`
        }
      ),
      limit: 10,
      order: [["id", "DESC"]],
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Erreur lors de la recherche :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

//  ✅ Routes classiques
router.get("/", transactionController.getAllTransactions);
router.post("/", transactionController.createTransaction);
router.get("/:id", transactionController.getTransactionById);
router.put("/:id", verifyToken, transactionController.updateTransaction);
router.put("/:id/status", verifyToken, transactionController.updateTransactionStatus);
router.delete("/:id", verifyToken, transactionController.deleteTransaction);
router.post("/predict", transactionController.analyzeTransaction);

module.exports = router;
