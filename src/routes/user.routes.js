const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authJwt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connexion à la base SQLite
const dbPath = path.resolve(__dirname, '../database/projet.db');
const db = new sqlite3.Database(dbPath);

//  GET /api/users/me
router.get('/me', verifyToken, (req, res) => {
  const userId = req.userId;

  db.get('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ message: 'Erreur base de données' });
    if (!row) return res.status(404).json({ message: 'Utilisateur introuvable' });

    res.json(row);
  });
});

module.exports = router;
