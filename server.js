require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./src/config/db"); 
require('./src/models'); 


const app = express();
const PORT = process.env.PORT || 3000;

//  Middlewares
app.use(cors());
app.use(express.json());

//  Connexion à la base Sequelize (SQLite)
db.sequelize.authenticate()
  .then(() => {
    console.log(" Base de données SQLite connectée.");
    return db.sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log(" Modèles Sequelize synchronisés.");
  })


//  Import des routes
const emailRoutes = require("./src/routes/email.routes");
const smsRoutes = require("./src/routes/sms.routes");
const authRoutes = require("./src/routes/auth.routes");
const transactionRoutes = require("./src/routes/transaction.routes");
const whatsappRoutes = require("./src/routes/whatsapp.routes");
const userRoutes = require("./src/routes/user.routes");
const notificationRoutes = require("./src/routes/notification.routes");

//  Enregistrement des routes
app.use("/api/email", emailRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

//  Route de test
app.get("/", (req, res) => {
  res.send(" Backend HPS en ligne !");
});

//  Démarrage serveur
app.listen(PORT, () => {
  console.log(` Serveur lancé sur http://localhost:${PORT}`);
});
