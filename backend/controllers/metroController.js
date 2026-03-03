const mongoose = require("mongoose");
const { getProductModel, productSchema } = require("../models/productModel");

async function storeMetroData(items) {
  try {
    const productModel = getProductModel("Metro");
    let processedCount = 0;
    let skippedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 1; i < items.length; i++) {
      if (!items[i] || !items[i][0] || items[i][0].trim() === "") {
        skippedCount++;
        continue;
      }

      const productName = items[i][0]?.trim() || "";
      const priceStr = items[i][1]?.trim() || "";
      const cleanedPrice = priceStr
        .replace(/Rs\.?\s*/i, "")
        .replace(/,/g, "")
        .trim();
      const originalPrice = parseFloat(cleanedPrice) || 0;

      if (originalPrice === 0) {
        skippedCount++;
        continue;
      }

      let productURL = items[i][5]?.trim() || "";
      const productImage = items[i][6]?.trim() || "";
      const discountStr = items[i][7]?.trim() || "0";
      let discount = 0;

      if (discountStr === "0" || discountStr === "") {
        discount = 0;
      } else if (discountStr.includes("%")) {
        const match = discountStr.match(/(\d+\.?\d*)\s*%/);
        if (match) {
          discount = parseFloat(match[1]);
        }
      } else {
        const numMatch = discountStr.match(/^(\d+\.?\d*)$/);
        if (numMatch) {
          discount = parseFloat(numMatch[1]);
        }
      }

      const discountedPrice =
        discount > 0
          ? Math.round(originalPrice * (1 - discount / 100))
          : originalPrice;

      let filter;
      if (productURL) {
        filter = {
          productURL: productURL,
          productName: productName,
          availableAt: "Metro",
        };
      } else if (productImage) {
        filter = {
          productName: productName,
          productImage: productImage,
          originalPrice: originalPrice,
          availableAt: "Metro",
        };
      } else {
        filter = {
          productName: productName,
          originalPrice: originalPrice,
          availableAt: "Metro",
        };
      }

      const existingDoc = await productModel.findOne(filter);
      const isNew = !existingDoc;

      await productModel.findOneAndUpdate(
        filter,
        {
          productName: productName,
          productImage: productImage,
          productURL: productURL,
          originalPrice: originalPrice,
          discountedPrice: discountedPrice,
          discount: discount,
          availableAt: "Metro",
        },
        { upsert: true, new: true },
      );

      if (isNew) {
        createdCount++;
      } else {
        updatedCount++;
        console.log(`[UPDATED] ${productName}`);
        console.log(
          `  Original Price: ${originalPrice}, Discounted Price: ${discountedPrice}, Discount: ${discount}%`,
        );
      }
      processedCount++;
    }

    console.log(
      `Metro: ${processedCount} processed (${createdCount} created, ${updatedCount} updated), ${skippedCount} skipped`,
    );
  } catch (error) {
    console.error("Error storing products:", error);
    throw error;
  }
}

const displayProducts = async (page = 1, limit = 50) => {
  const productModel = mongoose.model("Metro", productSchema, "Metro");

  const skip = (page - 1) * limit;
  const total = await productModel.countDocuments();
  const products = await productModel.find().skip(skip).limit(limit).lean();

  return {
    success: true,
    status: 200,
    count: products.length,
    total: total,
    page: page,
    totalPages: Math.ceil(total / limit),
    data: products,
  };
};

const displayProduct = async (productID = "nil") => {
  try {
    const productModel = mongoose.model("Metro", productSchema, "Metro");

    if (productID === "nil") {
      return { success: false, status: 404, message: "Product not found" };
    }

    const product = await productModel.findById(productID);

    if (!product) {
      return { success: false, status: 404, message: "Product not found" };
    }

    return {
      success: true,
      status: 200,
      data: {
        _id: product._id,
        productID: product.productID,
        productName: product.productName,
        productURL: product.productURL,
        productImage: product.productImage,
        originalPrice: product.originalPrice,
        discount: product.discount,
        discountedPrice: product.discountedPrice,
        availableAt: product.availableAt,
      },
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

module.exports = { storeMetroData, displayProducts, displayProduct };
