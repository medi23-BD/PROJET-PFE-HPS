module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Analyste'
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Utilisateur'
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'assets/images/avatar-default.png'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  User.associate = (models) => {
    User.hasMany(models.Transaction, {
      foreignKey: 'userId',
      onDelete: 'CASCADE'
    });
  };

  return User;
};
