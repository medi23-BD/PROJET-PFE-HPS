const db = require('../config/base-donnee');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


exports.register = (req, res) => {
  const { email, password } = req.body;

  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  
  const saltRounds = 10;
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors du hachage' });
    }

    
    const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.run(sql, [email, hashedPassword], function (err) {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la création de l’utilisateur', error: err.message });
      }
      return res.status(201).json({ message: 'Utilisateur créé avec succès', userId: this.lastID });
    });
  });
};


exports.login = (req, res) => {
  const { email, password } = req.body;

  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.get(sql, [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la vérification de l’utilisateur', error: err.message });
    }
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides (utilisateur inconnu)' });
    }

    
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la comparaison des mots de passe' });
      }
      if (!isMatch) {
        return res.status(401).json({ message: 'Identifiants invalides (mauvais mot de passe)' });
      }

      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '5h' }
      );

      return res.status(200).json({
        message: 'Connexion réussie',
        token
      });
    });
  });
};
