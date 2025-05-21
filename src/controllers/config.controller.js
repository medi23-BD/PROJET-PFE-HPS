const db = require('../models');
const Rule = db.Rule;
const Threshold = db.Threshold;

exports.getRules = async (req, res) => {
  try {
    const rules = await Rule.findAll();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du chargement des règles' });
  }
};

exports.updateRules = async (req, res) => {
  try {
    const updates = req.body; // tableau [{ id, active }]
    for (const rule of updates) {
      await Rule.update({ active: rule.active }, { where: { id: rule.id } });
    }
    res.json({ message: 'Mise à jour réussie' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

exports.getThresholds = async (req, res) => {
  try {
    const seuil = await Threshold.findOne({ where: { id: 1 } });
    if (seuil) res.json(seuil);
    else res.status(404).json({ error: "Seuils non trouvés" });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour les seuils
exports.updateThresholds = async (req, res) => {
  try {
    const { info, suspect, critique } = req.body;
    await Threshold.update(
      { info, suspect, critique },
      { where: { id: 1 } }
    );
    res.json({ message: "Seuils mis à jour avec succès" });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
