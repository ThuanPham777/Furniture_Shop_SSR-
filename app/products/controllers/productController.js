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
    const idWithName = req.params.idWithName;

    // Tách ID và Name
    const [id, ...nameParts] = idWithName.split('-');
    const name = nameParts.join('-'); // Gộp lại phần tên

    // Lấy sản phẩm theo ID
    const product = await productService.getProductById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // So sánh name từ URL với tên sản phẩm thực tế
    const expectedName = product.name.replace(/\s+/g, '-').toLowerCase();
    if (name.toLowerCase() !== expectedName) {
      // Redirect đến URL chuẩn nếu không khớp
      return res.redirect(`/shop/${id}-${expectedName}`);
    }

    const { products } = await productService.getProducts();

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
