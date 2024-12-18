const cartService = require("../../cart/services/cartService");
const productService = require("../../products/services/productService");
const Redis = require("ioredis");
// const redis = new Redis(); //localenv
const redis = new Redis({ host: "redisdb" }); //docker-env
var sessionId = " ";
//Add a new item to the cart
async function addCartItem(req, res) {
  const userId = req.user?._id;
  const { productId, quantity } = req.body;
  sessionId = req.sessionID;
  console.log("heluuu");
  console.log(req.body);
  console.log(req.user?._id);
  console.log(sessionId);
  try {
    if (userId) {
      const cartItem = await cartService.addCartItem(
        userId,
        productId,
        quantity
      );
      if (cartItem.error) {
        res.status(400).json({ message: cartItem.error });
      } else {
        res.status(200).json({
          message: "Item added to cart successfully",
          cartItem,
        });
      }
    } else {
      // Người dùng chưa đăng nhập -> Cache vào Redis
      const cartKey = `cart:${sessionId}`;
      const existingCart = await redis.get(cartKey);
      let cart = existingCart ? JSON.parse(existingCart) : [];
      const productIndex = cart.findIndex(
        (item) => item.productId === productId
      );

      if (productIndex > -1) {
        cart[productIndex].quantity += quantity;
      } else {
        cart.push({ productId, quantity });
      }

      await redis.set(cartKey, JSON.stringify(cart), "EX", 3600); // TTL 1 giờ
      return res
        .status(200)
        .json({ message: "Item added to cart successfully (cached)" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
async function syncCartAfterLogin(req, res) {
  const userId = req.user._id; // ID người dùng đã đăng nhập
  console.log("sid", sessionId);
  const cartKey = `cart:${sessionId}`;

  try {
    const cachedCart = await redis.get(cartKey);
    if (cachedCart) {
      const cartItems = JSON.parse(cachedCart);
      for (const { productId, quantity } of cartItems) {
        await cartService.addCartItem(userId, productId, quantity); // Thêm từng sản phẩm vào giỏ hàng
      }

      // Xoá giỏ hàng cache sau khi đồng bộ
      await redis.del(cartKey);
    }
  } catch (error) {
    console.error("Error syncing cart:", error.message);
  }
}

//Update the quantity of an existing item in the cart
async function updateCartItem(req, res) {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  // Validate quantity
  if (!quantity || quantity < 1) {
    return res
      .status(400)
      .json({ message: "Quantity must be a positive number" });
  }

  try {
    // Update the cart item quantity in the database
    const updatedCartItem = await cartService.updateCartItemQuantity(
      userId,
      productId,
      quantity
    );

    if (updatedCartItem.error) {
      console.log(updatedCartItem.error);
      return res.status(400).json({ message: updatedCartItem.error });
    }

    if (!updatedCartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const product = await productService.getProductById(productId);

    const { totalQuantity, totalAmount } =
      await cartService.calculateCartTotals(userId);

    res.status(200).json({
      message: "Cart item quantity updated successfully",
      updatedCartItem: {
        price: (product.salePrice || product.price) * quantity,
        quantity,
      },
      totalQuantity,
      totalAmount,
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: "Failed to update cart item" });
  }
}

//Delete a single item from the cart
async function deleteCartItem(req, res) {
  const userId = req.user._id;
  const { productId } = req.params;

  try {
    const deletedItem = await cartService.deleteCartItem(userId, productId);

    if (!deletedItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Recalculate totals after item deletion
    const { cartItems, totalQuantity, totalAmount } =
      await cartService.calculateCartTotals(userId);

    res.status(200).json({
      message: "Cart item deleted successfully",
      cartItems,
      totalQuantity,
      totalAmount,
    });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res.status(500).json({ message: "Failed to delete cart item" });
  }
}

//Delete all items in the cart
async function deleteAllCartItems(req, res) {
  const userId = req.user._id;

  try {
    await cartService.deleteAllCartItems(userId);
    const { cartItems, totalQuantity, totalAmount } =
      await cartService.calculateCartTotals(userId);

    res.status(200).json({
      message: "All cart items deleted successfully",
      cartItems,
      totalQuantity,
      totalAmount,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

module.exports = {
  addCartItem,
  updateCartItem,
  deleteCartItem,
  deleteAllCartItems,
  syncCartAfterLogin,
};
