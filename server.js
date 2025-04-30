require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Import des routes
const emailRoutes = require("./src/routes/email.routes");
const smsRoutes = require("./src/routes/sms.routes");
const authRoutes = require("./src/routes/auth.routes");
const transactionRoutes = require("./src/routes/transaction.routes");
const whatsappRoutes = require("./src/routes/whatsapp.routes");
const userRoutes = require("./src/routes/user.routes"); // ✅ corrigé ici

// ✅ Enregistrement des routes
app.use("/api/email", emailRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/users", userRoutes); // ✅ permet /me

// ✅ Route de test
app.get("/", (req, res) => {
  res.send("Projet PFE HPS – Backend en ligne !");
});

// ✅ Lancement du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
