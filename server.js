require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { sequelize } = require("./src/models");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Connexion à SQLite via Sequelize
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ SQLite connecté avec succès.");

    // ⛔️ Supprime ceci si tu ne veux plus de modifications automatiques
    // await sequelize.sync({ alter: true });

    // ✅ Utilise simplement sync() pour ne rien supprimer ni modifier
    await sequelize.sync();
    console.log("✅ Modèles Sequelize synchronisés (sans altérations).");
  } catch (error) {
    console.error("❌ Erreur connexion base :", error.message);
    process.exit(1);
  }
})();

// ✅ Import des routes
const routes = {
  "/api/email": require("./src/routes/email.routes"),
  "/api/sms": require("./src/routes/sms.routes"),
  "/api/auth": require("./src/routes/auth.routes"),
  "/api/transactions": require("./src/routes/transaction.routes"),
  "/api/whatsapp": require("./src/routes/whatsapp.routes"),
  "/api/users": require("./src/routes/user.routes"),
  "/api/notifications": require("./src/routes/notification.routes"),
};

// ✅ Enregistrement dynamique des routes
Object.entries(routes).forEach(([path, router]) => {
  app.use(path, router);
});

// ✅ Route de test
app.get("/", (req, res) => {
  res.send("Backend HPS opérationnel !");
});

// ✅ Lancement serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé : http://localhost:${PORT}`);
});
