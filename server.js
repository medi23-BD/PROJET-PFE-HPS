require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express(); 

const emailRoutes = require('./src/routes/email.route');
const authRoutes = require("./src/routes/auth.routes");
const transactionRoutes = require("./src/routes/transaction.routes");

const PORT = process.env.PORT || 3000;

// 🌍 Autoriser les requêtes depuis n'importe quelle origine
app.use(cors());

// 📌 Autoriser le parsing du JSON
app.use(express.json());

// -----------------------------
//    MONTAGE DES ROUTES
// -----------------------------

// ✅ Routes d'email alerte
app.use('/api/email', emailRoutes);

// ✅ Routes d'authentification
app.use("/api/auth", authRoutes);

// ✅ Routes des transactions
app.use("/api/transactions", transactionRoutes);

// ✅ Route de test
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
