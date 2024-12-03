// services/orderService.js
const Cart = require('../../cart/models/cartModel');
const Order = require('../models/orderModel');

exports.createOrder = async (userId, paymentMethod, address, transactionId) => {
  try {
    // Lấy các sản phẩm trong giỏ hàng của người dùng
    const cartItems = await Cart.find({ userId }).populate('productId');
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Tính tổng số tiền
    let totalAmount = 0;
    const items = cartItems.map((item) => {
      const price = item.productId.salePrice || item.productId.price; // Giá của sản phẩm
      totalAmount += price * item.quantity;
      return {
        productId: item.productId._id,
        quantity: item.quantity,
        price,
      };
    });

    // Tạo đơn hàng
    const newOrder = new Order({
      userId,
      items,
      totalAmount,
      address,
      payment: {
        method: paymentMethod,
        transactionId,
        date: new Date(),
      },
      status: 'Pending', // Đơn hàng ban đầu có trạng thái là "Pending"
    });

    // Lưu đơn hàng
    await newOrder.save();

    // Xóa giỏ hàng sau khi đã tạo đơn
    await Cart.deleteMany({ userId });

    return newOrder; // Trả về đơn hàng vừa tạo
  } catch (error) {
    throw new Error('Error creating order: ' + error.message);
  }
};

exports.getOrderById = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate('userId')
      .populate('items.productId');
    if (!order) {
      throw new Error('Order not found'); // Ném lỗi nếu không tìm thấy
    }
    return order; // Trả về đơn hàng nếu tìm thấy
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error; // Ném lỗi ra ngoài để controller hoặc handler xử lý
  }
};

exports.getAllOrdersByUserID = async (userId) => {
  try {
    const orders = await Order.find({ userId })
      .populate('userId')
      .populate('items.productId');
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res
      .status(500)
      .json({ success: false, error: 'Có lỗi xảy ra, vui lòng thử lại!' });
  }
};
