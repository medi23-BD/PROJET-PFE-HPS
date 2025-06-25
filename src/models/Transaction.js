// models/transaction.js
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    montant: DataTypes.FLOAT,
    lieu: DataTypes.STRING,
    dateTransaction: DataTypes.STRING,
    typeTerminal: DataTypes.STRING,
    carte: DataTypes.STRING,
    prediction: DataTypes.INTEGER,
    mse: DataTypes.FLOAT,
    proba_xgb: DataTypes.FLOAT,
    hybrid_score: DataTypes.FLOAT,
    criticite: DataTypes.STRING,
    statut: DataTypes.STRING,
    merchant_name: DataTypes.STRING,
    merchant_city: DataTypes.STRING,

    // ✅ Passage en JSON natif
    rulesTriggered: DataTypes.JSON,

    // ✅ Champs latitude / longitude ajoutés
    latitude: {
      type: DataTypes.REAL,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.REAL,
      allowNull: true,
    }
  }, {
    tableName: 'transactions',
    timestamps: false,
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'CASCADE'
    });
  };

  return Transaction;
};
