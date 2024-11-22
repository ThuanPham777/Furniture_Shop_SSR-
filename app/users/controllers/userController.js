// controllers/userController.js
const bcrypt = require('bcryptjs');
const passport = require('passport');
const userService = require('../services/userService'); // Import user service

exports.signup = async (req, res) => {
  const { username, email, password, passwordConfirm } = req.body;

  try {
    // Kiểm tra xem mật khẩu có trùng khớp không
    if (password !== passwordConfirm) {
      return res.render('auth/signup', {
        error: 'Mật khẩu xác nhận không trùng khớp',
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const userExists = await userService.findUserByEmail(email);
    if (userExists) {
      return res.render('auth/signup', { error: 'Email đã được sử dụng' });
    }

    // Kiểm tra mật khẩu phức tạp
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.render('auth/signup', {
        error:
          'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
      });
    }

    // Tạo người dùng mới (mật khẩu sẽ được mã hóa trong middleware pre('save'))
    await userService.createUser({
      username,
      email,
      password,
    });

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('auth/signup', { error: 'Có lỗi xảy ra, vui lòng thử lại!' });
  }
};

// Xử lý đăng nhập
exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Error during authentication:', err);
      return res.redirect('/login');
    }
    if (!user) {
      console.error('Authentication failed:', info.message);
      return res.render('auth/login', { error: 'Invalid email or password' }); // Truyền lỗi vào view
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Error logging in:', err);
        return res.redirect('/login');
      }
      res.redirect('/shop'); // Redirect on success
    });
  })(req, res, next);
};

// Xử lý đăng xuất
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.redirect('/');
    }
    res.redirect('/login');
  });
};
