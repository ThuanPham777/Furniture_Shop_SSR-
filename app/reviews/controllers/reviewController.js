const reviewService = require('../services/reviewService');

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment, images } = req.body;
    const userId = req.user.id;
    const review = await reviewService.createReview(
      userId,
      productId,
      rating,
      comment,
      images
    );

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
