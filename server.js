require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/auth.routes");
const transactionRoutes = require("./src/routes/transaction.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// 🌍 Autoriser les requêtes depuis n'importe quelle origine
app.use(cors());

// 📌 Autoriser le parsing du JSON
app.use(express.json());

// 🔍 Vérification des modules chargés
if (!transactionRoutes) {
  console.error("❌ Erreur : transaction.routes non chargé !");
} else {
  console.log("✅ transaction.routes chargé avec succès !");
}

if (!authRoutes) {
  console.error("❌ Erreur : auth.routes non chargé !");
} else {
  console.log("✅ auth.routes chargé avec succès !");
}

// -----------------------------
//    MONTAGE DES ROUTES
// -----------------------------

// ✅ Routes d'authentification
app.use("/api/auth", authRoutes);

// ✅ Routes des transactions
app.use("/api/transactions", transactionRoutes);

// ✅ Route de test pour voir si le backend tourne
app.get("/", (req, res) => {
  res.send("🚀 Projet PFE HPS – Backend en ligne !");
});

// -----------------------------
//    LANCEMENT DU SERVEUR
// -----------------------------
app.listen(PORT, () => {
  console.log(`✅ Serveur Node.js lancé sur http://127.0.0.1:${PORT}`);
  console.log("📡 Prêt à recevoir des requêtes !");
});
