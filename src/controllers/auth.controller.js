const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ Enregistrement utilisateur
exports.register = async (req, res) => {
  try {
    const { email, password, role, fullName, avatar } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: role || 'Analyste',
      fullName: fullName || 'Utilisateur',
      avatar: avatar || 'assets/images/avatar-default.png'
    });

    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      userId: newUser.id
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erreur lors de la création de l’utilisateur',
      error: err.message
    });
  }
};

// ✅ Connexion utilisateur
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides (utilisateur inconnu)' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants invalides (mauvais mot de passe)' });
    }

    // ✅ Met à jour la date de dernière connexion
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    return res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erreur lors de la connexion',
      error: err.message
    });
  }
};
