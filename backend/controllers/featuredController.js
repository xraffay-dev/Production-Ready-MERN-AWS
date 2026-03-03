const mongoose = require("mongoose");

const getFeaturedProducts = async (limit = 8) => {
  try {
    const collection = mongoose.connection.db.collection(
      "Product Recommendations"
    );

    const products = await collection
      .aggregate([
        { $match: { best_deal: { $ne: null } } },
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
            category: 1,
            best_deal: 1,
            recommendations: { $slice: ["$recommendations", 3] },
            total_recommendations: 1,
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
    console.error("Error fetching featured products:", error);
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

const getRandomFeaturedProducts = async (limit = 8) => {
  try {
    const collection = mongoose.connection.db.collection(
      "Product Recommendations"
    );

    const products = await collection
      .aggregate([
        {
          $match: {
            image: {
              $exists: true,
              $ne: "",
              $not: /^data:image/,
            },
          },
        },
        { $sample: { size: limit } },
        {
          $project: {
            _id: 1,
            product_id: 1,
            product_name: 1,
            store: 1,
            price: 1,
            url: 1,
            image: 1,
            category: 1,
            best_deal: 1,
            recommendations: { $slice: ["$recommendations", 3] },
            total_recommendations: 1,
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
    console.error("Error fetching random featured products:", error);
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

const getProductById = async (productId) => {
  try {
    const collection = mongoose.connection.db.collection(
      "Product Recommendations"
    );

    const product = await collection.findOne({ product_id: productId });

    if (!product) {
      return {
        success: false,
        status: 404,
        message: "Product not found",
      };
    }

    return {
      success: true,
      status: 200,
      data: product,
    };
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

const getRelatedProducts = async (productId, category, limit = 4) => {
  try {
    const collection = mongoose.connection.db.collection(
      "Product Recommendations"
    );

    const products = await collection
      .aggregate([
        {
          $match: {
            product_id: { $ne: productId },
            category: category,
            image: {
              $exists: true,
              $ne: "",
              $not: /^data:image/,
            },
          },
        },
        { $sample: { size: limit } },
        {
          $project: {
            _id: 1,
            product_id: 1,
            product_name: 1,
            store: 1,
            price: 1,
            url: 1,
            image: 1,
            category: 1,
            best_deal: 1,
            recommendations: { $slice: ["$recommendations", 3] },
            total_recommendations: 1,
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
    console.error("Error fetching related products:", error);
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

module.exports = {
  getFeaturedProducts,
  getRandomFeaturedProducts,
  getProductById,
  getRelatedProducts,
};
