// src/models/Transaction.js

module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define("Transaction", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    montant: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    lieu: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dateTransaction: {
      type: DataTypes.STRING,
      allowNull: false
    },
    typeTerminal: {
      type: DataTypes.STRING
    },
    carte: {
      type: DataTypes.STRING
    },
    userId: {
      type: DataTypes.INTEGER
    },
    prediction: {
      type: DataTypes.INTEGER
    },
    mse: {
      type: DataTypes.FLOAT
    },
    proba_xgb: {
      type: DataTypes.FLOAT
    },
    proba_mlp: {
      type: DataTypes.FLOAT
    },
    statut: {
      type: DataTypes.STRING,
      defaultValue: 'Suspecté'
    }
  }, {
    timestamps: false,
    tableName: 'transactions'
  });

  return Transaction;
};
