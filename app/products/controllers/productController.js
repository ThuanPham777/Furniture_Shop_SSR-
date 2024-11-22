const productService = require('../services/productService'); // Service xử lý logic về sản phẩm

const getAllProducts = async (req, res, next) => {
  try {
    // Lấy các filter và phân trang từ query
    const filters = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    // Gọi productService để lấy dữ liệu sản phẩm
    const { products, totalPages } = await productService.getProducts(
      filters,
      page,
      limit
    );

    // Render lại view với dữ liệu sản phẩm và filter
    res.render('shop/shop', {
      products,
      filters, // Truyền filters vào để render lại trạng thái filter
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error retrieving products:', error);
    next(error);
  }
};

// Lấy thông tin sản phẩm theo ID
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const { products } = await productService.getProducts(); // Lấy tất cả sản phẩm để hiển thị trên trang chi tiết sản phẩm
    const product = await productService.getProductById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.render('shop/shopDetail', {
      product,
      products,
    });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
};
