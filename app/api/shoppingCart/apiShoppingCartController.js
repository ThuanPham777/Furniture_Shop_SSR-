const cartService = require('../../cart/services/cartService');

//Add a new item to the cart
async function addCartItem(req, res) {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  try {
    const cartItem = await cartService.addCartItem(userId, productId, quantity);
    if (cartItem.error) {
      res.status(400).json({ message: cartItem.error });
    } else {
      res.status(200).json({
        message: 'Item added to cart successfully',
        cartItem,
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
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
      .json({ message: 'Quantity must be a positive number' });
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
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.status(200).json({
      message: 'Cart item quantity updated successfully',
      updatedCartItem,
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Failed to update cart item' });
  }
}

//Delete a single item from the cart
async function deleteCartItem(req, res) {
  const userId = req.user._id;
  const { productId } = req.params;

  try {
    await cartService.deleteCartItem(userId, productId);
    res.status(200).json({ message: 'Cart item deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

//Delete all items in the cart
async function deleteAllCartItems(req, res) {
  const userId = req.user._id;

  try {
    await cartService.deleteAllCartItems(userId);
    res.status(200).json({ message: 'All cart items deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

module.exports = {
  addCartItem,
  updateCartItem,
  deleteCartItem,
  deleteAllCartItems,
};
