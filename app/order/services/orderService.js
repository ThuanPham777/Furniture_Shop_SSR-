// services/orderService.js
const Cart = require('../../cart/models/cartModel');
const Order = require('../models/orderModel');
const cartService = require('../../cart/services/cartService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

exports.processPayment = async ({ userId, address, paymentMethod }) => {
  try {
    // Fetch items from the user's cart
    const items = await cartService.getCartByUserId(userId);

    // Check if the cart is empty
    if (!items || items.length === 0) {
      throw new Error('Cart is empty. Cannot place order.');
    }

    // Handle payment via Stripe
    if (paymentMethod === 'Stripe') {
      const lineItems = items.map((item) => {
        const product = item.productId; // Access the populated product

        // Validate product data
        if (!product || !product.name || !product.price) {
          throw new Error(`Invalid product data for: ${item.productId}`);
        }

        const price = parseFloat(product.salePrice || product.price); // Convert to number
        if (isNaN(price)) {
          throw new Error(`Invalid price for product ${product.name}`);
        }

        return {
          price_data: {
            currency: 'usd',
            product_data: {
              images: [product.images[0]], // Use the first image of the product
              name: product.name,
              description: `Quantity: ${item.quantity}`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: item.quantity,
        };
      });
      // Create a Stripe session
      const domain =
        process.env.NODE_ENV === 'production'
          ? process.env.DOMAIN_HOST
          : process.env.DOMAIN;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: lineItems,
        success_url: `${domain}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domain}/checkout`,
        metadata: {
          address: JSON.stringify(address), // Serialize address to a string
        },
      });

      // Return the session URL for redirecting to Stripe
      return session.url;
    } else {
      throw new Error('Unsupported payment method.');
    }
  } catch (error) {
    console.error('Error in createOrderAndProcessPayment:', error);
    throw error; // Let the controller handle the error
  }
};
