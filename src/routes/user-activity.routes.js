const express = require('express');
const router = express.Router();
const { getUserActivity } = require('../controllers/user.controller');

router.get('/', getUserActivity);

module.exports = router;
