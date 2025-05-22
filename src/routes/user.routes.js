const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authJwt');
const { User } = require('../models');

// ✅ Route pour récupérer le profil utilisateur connecté
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'role', 'fullName', 'avatar', 'createdAt', 'lastLogin']
    });

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
