const reviewService = require('../services/reviewService');

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Extract images from the uploaded file(s)
    let images = [];
    if (req.files) {
      images = req.files.map((file) => file.path); // or file.url if using cloud storage
    } else if (req.file) {
      images = [req.file.path]; // Single file upload
    }

    // Call service layer function
    const review = await reviewService.createReview(
      userId,
      productId,
      rating,
      comment,
      images
    );

    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
