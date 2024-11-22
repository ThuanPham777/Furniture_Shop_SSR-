const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

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

module.exports = router;
