const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Transaction = sequelize.define('Transaction', {
  montant: DataTypes.FLOAT,
  lieu: DataTypes.STRING,
  dateTransaction: DataTypes.STRING,
  typeTerminal: DataTypes.STRING,
  carte: DataTypes.STRING,
  userId: DataTypes.INTEGER,
  prediction: DataTypes.INTEGER,
  mse: DataTypes.FLOAT,
  proba_xgb: DataTypes.FLOAT,
  hybrid_score: DataTypes.FLOAT,
  criticite: DataTypes.STRING,
  statut: DataTypes.STRING,
  merchant_name: DataTypes.STRING,
  merchant_city: DataTypes.STRING,
}, {
  tableName: 'transactions',
  timestamps: false,
});

module.exports = Transaction;
