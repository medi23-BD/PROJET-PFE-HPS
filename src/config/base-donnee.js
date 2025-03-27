// src/config/base-donnee.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/projet.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à SQLite :', err.message);
  } else {
    console.log('✅ Base de données SQLite connectée.');
    // Création de la table users si elle n'existe pas
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Erreur création table users :', err.message);
      } else {
        console.log('Table "users" prête ou déjà existante.');
      }
    });
  }
});

db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      montant REAL,
      lieu TEXT,
      dateTransaction TEXT,
      typeTerminal TEXT,
      carte TEXT,
      userId INTEGER,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Erreur création table transactions :', err.message);
    } else {
      console.log('Table "transactions" prête ou déjà existante.');
    }
  });
  

module.exports = db;

