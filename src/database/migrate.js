const Database = require('better-sqlite3');
const db = new Database('./src/database/projet.db');

const colonnes = [
  { nom: "prediction", type: "INTEGER" },
  { nom: "mse", type: "REAL" },
  { nom: "proba_xgb", type: "REAL" },
  { nom: "proba_mlp", type: "REAL" },
];

const infos = db.prepare(`PRAGMA table_info(transactions)`).all();

colonnes.forEach(({ nom, type }) => {
  const existe = infos.some(col => col.name === nom);
  if (!existe) {
    db.prepare(`ALTER TABLE transactions ADD COLUMN ${nom} ${type}`).run();
    console.log(`✅ Colonne ajoutée : ${nom}`);
  } else {
    console.log(`ℹ️ Colonne déjà existante : ${nom}`);
  }
});

db.close();
console.log("✅ Migration terminée proprement");
