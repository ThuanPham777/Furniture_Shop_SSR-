// controllers/userController.js
const passport = require('passport');
const userService = require('../services/userService'); // Import user service
const crypto = require('crypto');

exports.signup = async (req, res) => {
  const { username, email, password, passwordConfirm } = req.body;

  try {
    if (password !== passwordConfirm) {
      return res.render('auth/signup', {
        error: 'Mật khẩu xác nhận không trùng khớp',
      });
    }

    const userExists = await userService.findUserByEmail(email);
    if (userExists) {
      return res.render('auth/signup', { error: 'Email đã được sử dụng' });
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.render('auth/signup', {
        error:
          'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
      });
    }

    const user = await userService.createUser({ username, email, password });

    // Tạo token và lưu vào cơ sở dữ liệu
    const activationToken = user.createActivationToken();
    await user.save();

    // Gửi email kích hoạt
    await userService.sendActivationEmail(email, activationToken, req);

    res.render('auth/signup', {
      message:
        'Email kích hoạt đã được gửi! Vui lòng đăng nhập email của bạn để kích thoạt tài khoản',
    });
  } catch (err) {
    console.error(err);
    res.render('auth/signup', { error: 'Có lỗi xảy ra, vui lòng thử lại!' });
  }
};

exports.activateAccount = async (req, res) => {
  const { token } = req.params;

  try {
    // Hash lại token từ URL để so khớp với cơ sở dữ liệu
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await userService.findUserByActivationToken(hashedToken);

    if (!user || user.activationTokenExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Liên kết kích hoạt không hợp lệ hoặc đã hết hạn!',
      });
    }

    // Kích hoạt tài khoản
    user.isActive = true;
    user.activationToken = undefined; // Xóa token sau khi kích hoạt
    user.activationTokenExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Tài khoản của bạn đã được kích hoạt thành công!',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: 'Có lỗi xảy ra, vui lòng thử lại!',
    });
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
      return res.render('auth/login', { error: info.message }); // Truyền lỗi vào view
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error('Error logging in:', err);
        return res.redirect('/login');
      }
      res.redirect('/'); // Redirect on success
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
