const mongoose = require("mongoose");

const getFeaturedProductsWithMatches = async (limit = 8) => {
  try {
    const collection = mongoose.connection.db.collection("Product Matches");

    const products = await collection
      .aggregate([
        { $match: { total_matches: { $gte: 1 } } },
        { $addFields: { randomScore: { $rand: {} } } },
        { $sort: { randomScore: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            product_id: 1,
            product_name: 1,
            store: 1,
            price: 1,
            url: 1,
            image: 1,
            brand: 1,
            size: 1,
            unit: 1,
            exact_matches: 1,
            semantic_matches: 1,
            best_deal: 1,
            savings_analysis: 1,
            total_exact_matches: 1,
            total_semantic_matches: 1,
            total_matches: 1,
          },
        },
      ])
      .toArray();

    return {
      success: true,
      status: 200,
      count: products.length,
      data: products,
    };
  } catch (error) {
    console.error("Error fetching featured products with matches:", error);
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

const getProductMatchesById = async (productId) => {
  try {
    const collection = mongoose.connection.db.collection("Product Matches");
    const product = await collection.findOne({ product_id: productId });

    if (!product) {
      return {
        success: false,
        status: 404,
        message: "Product not found in matches collection",
      };
    }

    return {
      success: true,
      status: 200,
      data: product,
    };
  } catch (error) {
    console.error("Error fetching product matches by ID:", error);
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

const searchProductMatches = async (query, limit = 20) => {
  try {
    const collection = mongoose.connection.db.collection("Product Matches");

    const products = await collection
      .aggregate([
        {
          $match: {
            product_name: { $regex: query, $options: "i" },
          },
        },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            product_id: 1,
            product_name: 1,
            store: 1,
            price: 1,
            url: 1,
            image: 1,
            brand: 1,
            exact_matches: 1,
            semantic_matches: 1,
            total_matches: 1,
          },
        },
      ])
      .toArray();

    return {
      success: true,
      status: 200,
      count: products.length,
      data: products,
    };
  } catch (error) {
    console.error("Error searching product matches:", error);
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

const getProductRecommendations = async (productId, productName = null) => {
  try {
    const collection = mongoose.connection.db.collection(
      "Product Recommendations"
    );

    let product = await collection.findOne({ product_id: productId });

    if (!product && productName) {
      product = await collection.findOne({
        product_name: {
          $regex: `^${productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      });
    }

    if (!product) {
      return {
        success: false,
        status: 404,
        message: "Product not found in recommendations collection",
      };
    }

    return {
      success: true,
      status: 200,
      data: {
        recommendations: product.recommendations || [],
        total_recommendations: product.total_recommendations || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching product recommendations:", error);
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

module.exports = {
  getFeaturedProductsWithMatches,
  getProductMatchesById,
  searchProductMatches,
  getProductRecommendations,
};
