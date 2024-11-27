const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const {
  ensureAuthenticated,
} = require('../../../middleware/auth/ensureAuthenticated');

router.get('/', ensureAuthenticated, cartController.getAllCart);

module.exports = router;
