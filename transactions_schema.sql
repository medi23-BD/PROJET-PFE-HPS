DROP TABLE IF EXISTS transactions;

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  montant REAL,
  lieu TEXT,
  dateTransaction TEXT,
  typeTerminal TEXT,
  carte TEXT,
  userId INTEGER,
  prediction INTEGER,
  mse REAL,
  proba_xgb REAL,
  hybrid_score REAL,
  criticite TEXT,
  statut TEXT,
  merchant_name TEXT,
  merchant_city TEXT
);
