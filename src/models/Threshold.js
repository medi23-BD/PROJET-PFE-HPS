module.exports = (sequelize, DataTypes) => {
  const Threshold = sequelize.define('Threshold', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    info: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    suspect: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    critique: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  });

  return Threshold;
};
