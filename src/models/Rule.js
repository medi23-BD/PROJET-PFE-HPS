module.exports = (sequelize, DataTypes) => {
  const Rule = sequelize.define('Rule', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  });

  return Rule;
};
