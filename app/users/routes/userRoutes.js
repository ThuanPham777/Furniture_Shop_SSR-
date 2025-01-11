const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const crypto = require('crypto');
const passport = require('passport');
const upload = require('../../../config/upload');
const Redis = require('ioredis');
const redis = new Redis(); //localenv
const apiShoppingCartController = require('../../api/shoppingCart/apiShoppingCartController');

const {
  ensureAuthenticated,
} = require('../../../middleware/auth/ensureAuthenticated');
// Trang đăng ký
router.get('/signup', (req, res) => res.render('auth/signup'));

// Trang đăng nhập
router.get('/login', (req, res) => res.render('auth/login'));

//  Trang profile
router.get('/profile', (req, res) => res.render('auth/profile'));

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
// Hiển thị form đặt lại mật khẩu
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const userData = await redis.get(`resetToken:${hashedToken}`);

    if (!userData) {
      return res.render('auth/reset-password', {
        error: 'Liên kết không hợp lệ hoặc đã hết hạn!',
      });
    }

    res.render('auth/reset-password', { token, error: null });
  } catch (err) {
    console.error(err);
    res.render('auth/reset-password', {
      error: 'Đã xảy ra lỗi. Vui lòng thử lại!',
    });
  }
});

router.post('/reset-password/:token', userController.resetPassword);

// Google Login Route
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google Callback Route
router.get('/auth/google/callback', (req, res) => {
  const oldSessionId = req.sessionID; // Lưu sessionId cũ TRƯỚC khi xác thực
  passport.authenticate('google', { failureRedirect: '/login' })(
    req,
    res,
    () => {
      apiShoppingCartController.syncCartAfterLogin(req, res, oldSessionId);
      res.redirect('/');
    }
  );
});

router.post(
  '/profile/edit',
  ensureAuthenticated,
  upload.single('avatar'),
  userController.editProfile
);
router.post(
  '/profile/change-password',
  ensureAuthenticated,
  userController.changePassword
);

module.exports = router;
