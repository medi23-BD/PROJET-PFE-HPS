const { User } = require('../models');

const getUserActivity = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['fullName', 'email', 'role', 'avatar', 'lastLogin'],
      order: [['lastLogin', 'DESC']],
      limit: 10
    });

    res.json(users);
  } catch (error) {
    console.error('Erreur récupération activité utilisateurs :', error.message);
    res.status(500).json({ error: 'Erreur serveur activité utilisateurs' });
  }
};

module.exports = { getUserActivity };
