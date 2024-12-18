// controllers/userController.js
const passport = require("passport");
const userService = require("../services/userService"); // Import user service
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const apiShoppingCartController = require("../../api/shoppingCart/apiShoppingCartController");

exports.signup = async (req, res) => {
  const { username, email, password, passwordConfirm } = req.body;

  try {
    if (password !== passwordConfirm) {
      return res.render("auth/signup", {
        error: "Mật khẩu xác nhận không trùng khớp",
      });
    }

    const userExists = await userService.findUserByEmail(email);
    if (userExists) {
      return res.render("auth/signup", { error: "Email đã được sử dụng" });
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.render("auth/signup", {
        error:
          "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
      });
    }

    const user = await userService.createUser({ username, email, password });

    // Tạo token và lưu vào cơ sở dữ liệu
    const activationToken = user.createActivationToken();
    await user.save();

    // Gửi email kích hoạt
    await userService.sendActivationEmail(email, activationToken, req);

    res.render("auth/signup", {
      message:
        "Email kích hoạt đã được gửi! Vui lòng đăng nhập email của bạn để kích thoạt tài khoản",
    });
  } catch (err) {
    console.error(err);
    res.render("auth/signup", { error: "Có lỗi xảy ra, vui lòng thử lại!" });
  }
};

// Xử lý đăng nhập
exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Error during authentication:", err);
      return res.redirect("/login");
    }
    if (!user) {
      console.error("Authentication failed:", info.message);
      return res.render("auth/login", { error: info.message }); // Truyền lỗi vào view
    }

    req.logIn(user, async (err) => {
      if (err) {
        console.error("Error logging in:", err);
        return res.redirect("/login");
      }
      res.redirect("/");
      console.log("hiiii");
      await apiShoppingCartController.syncCartAfterLogin(req, res);
    });
  })(req, res, next);
};

// Xử lý đăng xuất
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.redirect("/");
    }
    res.redirect("/login");
  });
};

exports.activateAccount = async (req, res) => {
  const { token } = req.params;

  try {
    // Hash lại token từ URL để so khớp với cơ sở dữ liệu
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userService.findUserByActivationToken(hashedToken);

    if (!user || user.activationTokenExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        error: "Liên kết kích hoạt không hợp lệ hoặc đã hết hạn!",
      });
    }

    // Kích hoạt tài khoản
    user.isActive = true;
    user.activationToken = undefined; // Xóa token sau khi kích hoạt
    user.activationTokenExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Tài khoản của bạn đã được kích hoạt thành công!",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "Có lỗi xảy ra, vui lòng thử lại!",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.render("auth/forgot-password", {
        error: "Email không tồn tại!",
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email with reset link
    await userService.sendPasswordResetEmail(email, resetToken, req);

    res.render("auth/forgot-password", {
      message: "Email đặt lại mật khẩu đã được gửi!",
    });
  } catch (err) {
    console.error(err);
    res.render("auth/forgot-password", {
      error: "Đã xảy ra lỗi. Vui lòng thử lại!",
    });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userService.findUserByResetToken(hashedToken);

    if (!user) {
      return res.render("auth/reset-password", {
        error: "Liên kết không hợp lệ hoặc đã hết hạn!",
      });
    }

    if (password !== passwordConfirm) {
      return res.render("auth/reset-password", {
        token,
        error: "Mật khẩu không khớp!",
      });
    }

    // Update password (hash password in userSechema)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("auth/reset-password", {
      token,
      error: "Đã xảy ra lỗi. Vui lòng thử lại!",
    });
  }
};

// Edit profile
exports.editProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      username,
      firstName,
      lastName,
      phoneNumber,
      address,
      city,
      province,
    } = req.body;

    const user = await userService.findUserById(userId);
    if (!user) {
      return res.status(404).render("auth/profile", {
        editProfile_message: "User not found",
        success: false,
        user: req.body,
      });
    }

    let avatarUrl = null;
    if (req.file) {
      try {
        avatarUrl = await userService.uploadAvatar(userId, req.file); // Wait for avatar upload
      } catch (err) {
        return res.status(400).render("auth/profile", {
          editProfile_message: err.message,
          success: false,
          user: req.body,
        });
      }
    }

    const updatedUser = await userService.updateUser(userId, {
      username,
      firstName,
      lastName,
      phoneNumber,
      address,
      city,
      province,
      ...(avatarUrl && { avatarUrl }), // Add avatar URL if it's set
    });

    res.status(200).render("auth/profile", {
      editProfile_message: "Profile updated successfully",
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).render("auth/profile", {
      editProfile_message: "Error updating profile",
      success: false,
      error: error.message,
      user: req.body,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (newPassword !== confirmNewPassword) {
      return res.status(400).render("auth/profile", {
        changePassword_message: "New password and confirmation do not match",
        success: false,
      });
    }

    // Tìm người dùng
    const user = await userService.findUserById(userId);
    if (!user) {
      return res.status(404).render("auth/profile", {
        changePassword_message: "User not found",
        success: false,
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).render("auth/profile", {
        changePassword_message: "Current password is incorrect",
        success: false,
      });
    }

    // Cập nhật mật khẩu mới (được mã hóa ở userSchema)
    user.password = newPassword;
    await user.save();

    res.status(200).render("auth/profile", {
      changePassword_message: "Password changed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).render("auth/profile", {
      changePassword_message: "Error changing password",
      success: false,
      error: error.message,
    });
  }
};
