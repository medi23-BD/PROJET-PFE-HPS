// src/controllers/notification.controller.js

const db = require('../models');
const Notification = db.Notification;

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

exports.searchSuggestions = async (req, res) => {
  const query = req.query.q?.toLowerCase() || '';

  try {
    const allNotifications = await Notification.findAll({
      attributes: ['message']
    });

    const suggestions = allNotifications
      .map(n => n.message)
      .filter(msg => msg && msg.toLowerCase().includes(query))
      .slice(0, 10);

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
exports.createNotification = async (req, res) => {
  try {
    const { message, details, level } = req.body;
    const notification = await Notification.create({
      message,
      details,
      level,
      timestamp: new Date()
    });    

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
