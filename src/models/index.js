const { sequelize } = require('../config/db');
const Transaction = require('./Transaction');
const Notification = require('./Notification');

module.exports = {
  sequelize,
  Transaction,
  Notification,
};
