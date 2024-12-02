const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');

const {
  ensureAuthenticated,
} = require('../../../middleware/auth/ensureAuthenticated');

router.get('/checkout', ensureAuthenticated, orderController.checkout);

router.post('/place-order', ensureAuthenticated, orderController.placeOrder);

router.get(
  '/order-success/:orderId',
  ensureAuthenticated,
  orderController.orderSuccess
);

module.exports = router;
