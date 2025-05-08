const { Sequelize, sequelize } = require('../config/db');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Transaction = require("./Transaction")(sequelize, Sequelize.DataTypes);
db.Notification = require("./Notification")(sequelize, Sequelize.DataTypes);

module.exports = db;
