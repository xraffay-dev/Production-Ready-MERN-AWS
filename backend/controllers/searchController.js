const { getProductModel } = require("../models/productModel");
const { sanitizeSearchQuery } = require("../utils/queryHelpers");

const searchProducts = async (req, res) => {
  try {
    const { query, limit = 50 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const sanitizedQuery = sanitizeSearchQuery(query);
    const searchRegex = new RegExp(sanitizedQuery, "i");
    const limitNum = parseInt(limit);

    const stores = [
      "Metro",
      "Al-Fatah",
      "Jalal Sons",
      "Raja Sahib",
      "Rahim Store",
    ];

    const searchPromises = stores.map((storeName) => {
      const Model = getProductModel(storeName);
      return Model.find({ productName: searchRegex }).limit(limitNum).lean();
    });

    const results = await Promise.all(searchPromises);
    const allResults = results.flat();

    const uniqueResults = allResults.reduce((acc, product) => {
      const existingProduct = acc.find(
        (p) =>
          p.productName.toLowerCase() === product.productName.toLowerCase(),
      );

      if (!existingProduct) {
        acc.push(product);
      } else if (
        product.discountedPrice &&
        product.discountedPrice < existingProduct.discountedPrice
      ) {
        const index = acc.indexOf(existingProduct);
        acc[index] = product;
      }

      return acc;
    }, []);

    const sortedResults = uniqueResults
      .sort((a, b) => {
        const aPrice = a.discountedPrice || a.originalPrice;
        const bPrice = b.discountedPrice || b.originalPrice;
        return aPrice - bPrice;
      })
      .slice(0, limitNum);

    res.status(200).json({
      success: true,
      count: sortedResults.length,
      data: sortedResults,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error.message,
    });
  }
};

module.exports = { searchProducts };
