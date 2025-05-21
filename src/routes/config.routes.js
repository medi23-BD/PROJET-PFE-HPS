const express = require('express');
const router = express.Router();
const controller = require('../controllers/config.controller');

// Règles métier
router.get('/rules', controller.getRules);
router.post('/rules', controller.updateRules);

// Seuils IA
router.get('/seuils', controller.getThresholds);
router.post('/seuils', controller.updateThresholds);

module.exports = router;
