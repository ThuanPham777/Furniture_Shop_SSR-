const cartService = require('../services/cartService');

exports.getAllCart = async (req, res) => {
  const userId = req.user._id;

  try {
    // Lấy dữ liệu từ cart
    const cartItems = await cartService.getCartByUserId(userId);

    // Kiểm tra xem giỏ hàng có sản phẩm không
    if (cartItems.length === 0) {
      return res.render('cart/cart', {
        cartItems,
        totalQuantity: 0,
        totalAmount: 0,
        cartEmpty: true,
      });
    }

    // Tính tổng tiền và số lượng nếu giỏ hàng có sản phẩm
    const totalQuantity = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalAmount = cartItems.reduce(
      (sum, item) =>
        sum +
        item.quantity * (item.productId.salePrice || item.productId.price),
      0
    );

    res.render('cart/cart', {
      cartItems,
      totalQuantity,
      totalAmount,
      cartEmpty: false,
    });
  } catch (error) {
    res.status(500).send('Error fetching cart');
  }
};
