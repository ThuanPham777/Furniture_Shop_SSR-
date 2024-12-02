// controllers/orderController.js
const orderService = require('../services/orderService');
const Cart = require('../../cart/models/cartModel');
const User = require('../../users/models/userModel');

exports.checkout = async (req, res) => {
  try {
    const userId = req.user._id; // Lấy thông tin user nếu có

    // Lấy các sản phẩm trong giỏ hàng
    const cartItems = await Cart.find({ userId }).populate('productId');

    const user = await User.findById(userId);

    if (!cartItems || cartItems.length === 0) {
      return res.redirect('/cart'); // Nếu giỏ hàng trống, chuyển hướng về giỏ hàng
    }

    let totalAmount = 0;
    let totalQuantity = 0;

    const items = cartItems.map((item) => {
      const product = item.productId;
      const price = product.salePrice || product.price; // Giá của sản phẩm
      const quantity = item.quantity;
      totalAmount += price * quantity;
      totalQuantity += quantity; // Cộng dồn số lượng

      return {
        productId: product._id,
        quantity,
        price,
      };
    });

    // Render trang checkout với dữ liệu giỏ hàng
    res.render('checkout/checkout', {
      user,
      items,
      totalAmount,
      totalQuantity,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong!');
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const { paymentMethod, address, transactionId } = req.body;
    const userId = req.user._id; // Giả sử bạn đã có thông tin người dùng

    // Gọi service để tạo đơn hàng
    const newOrder = await orderService.createOrder(
      userId,
      paymentMethod,
      address,
      transactionId
    );

    // Redirect đến trang thành công
    res.redirect(`order-success/${newOrder._id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong!');
  }
};

exports.orderSuccess = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Render trang thành công và gửi thông tin đơn hàng
    res.render('order/order-success', {
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong!');
  }
};
