const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');

//  Obtenir les 10 dernières notifications
router.get('/', controller.getNotifications);

//  Recherche dynamique (auto-suggest)
router.get('/search', controller.searchSuggestions);

//  Ajouter une notification
router.post('/', controller.createNotification);

module.exports = router;
