const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userService = require('../services/userService');
const crypto = require('crypto');

// Trang đăng ký
router.get('/signup', (req, res) => res.render('auth/signup'));

// Trang đăng nhập
router.get('/login', (req, res) => res.render('auth/login'));

// Xử lý đăng ký
router.post('/signup', userController.signup);

// Xử lý đăng nhập
router.post('/login', userController.login);

// Xử lý đăng xuất
router.get('/logout', userController.logout);

router.get('/activate/:token', userController.activateAccount);

// GET: Forgot Password Form
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { error: null });
});

router.post('/forgot-password', userController.forgotPassword);

// GET: Reset Password Form
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await userService.findUserByResetToken(hashedToken);

  if (!user) {
    return res.render('auth/reset-password', {
      error: 'Liên kết không hợp lệ hoặc đã hết hạn!',
    });
  }

  res.render('auth/reset-password', { token, error: null });
});

router.post('/reset-password/:token', userController.resetPassword);

module.exports = router;
