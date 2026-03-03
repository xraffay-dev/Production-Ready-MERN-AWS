const mongoose = require("mongoose");
const { getProductModel, productSchema } = require("../models/productModel");

async function storeRajaSahibData(items) {
  try {
    const productModel = getProductModel("Raja Sahib");
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

      // Column [1] is the current/discounted price
      const currentPriceStr = items[i][1]?.trim() || "";
      const cleanedCurrentPrice = currentPriceStr
        .replace(/Rs\.?\s*/i, "")
        .replace(/,/g, "")
        .trim();
      const currentPrice = parseFloat(cleanedCurrentPrice) || 0;

      if (currentPrice === 0) {
        skippedCount++;
        continue;
      }

      // Column [2] is the original price
      const originalPriceStr = items[i][2]?.trim() || "";
      const cleanedOriginalPrice = originalPriceStr
        .replace(/Rs\.?\s*/i, "")
        .replace(/,/g, "")
        .trim();
      const parsedOriginalPrice = parseFloat(cleanedOriginalPrice) || 0;

      // Column [3] is the discount percentage
      const discountStr = items[i][3]?.trim() || "";
      const parsedDiscount = parseFloat(discountStr) || 0;

      // If original price is empty, use current price and set discount to 0
      let originalPrice, discountedPrice, discount;
      if (parsedOriginalPrice === 0 || !originalPriceStr) {
        originalPrice = currentPrice;
        discountedPrice = currentPrice;
        discount = 0;
      } else {
        originalPrice = parsedOriginalPrice;
        discountedPrice = currentPrice;
        discount = parsedDiscount;
      }
      let productURL = items[i][5]?.trim() || "";
      const productImage = items[i][4]?.trim() || "";

      let filter;
      if (productURL) {
        filter = {
          productURL: productURL,
          productName: productName,
          availableAt: "Raja Sahib",
        };
      } else if (productImage) {
        filter = {
          productName: productName,
          productImage: productImage,
          originalPrice: originalPrice,
          availableAt: "Raja Sahib",
        };
      } else {
        filter = {
          productName: productName,
          originalPrice: originalPrice,
          availableAt: "Raja Sahib",
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
          availableAt: "Raja Sahib",
        },
        { upsert: true, new: true }
      );

      if (isNew) {
        createdCount++;
      } else {
        updatedCount++;
        console.log(`[UPDATED] ${productName}`);
        console.log(
          `  Original Price: ${originalPrice}, Discounted Price: ${discountedPrice}, Discount: ${discount}%`
        );
      }
      processedCount++;
    }

    console.log(
      `Raja Sahib: ${processedCount} processed (${createdCount} created, ${updatedCount} updated), ${skippedCount} skipped`
    );
  } catch (error) {
    console.error("Error storing products:", error);
    throw error;
  }
}

const displayProducts = async () => {
  const productModel = mongoose.model(
    "Raja Sahib",
    productSchema,
    "Raja Sahib"
  );
  const products = await productModel.find();

  return {
    success: true,
    status: 200,
    count: products.length,
    data: products,
  };
};

const displayProduct = async (productID = "nil") => {
  try {
    const productModel = mongoose.model(
      "Raja Sahib",
      productSchema,
      "Raja Sahib"
    );

    if (productID === "nil") {
      return { success: false, status: 404, message: "Product not found" };
    }

    // Search by MongoDB _id instead of productID field
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

module.exports = { storeRajaSahibData, displayProducts, displayProduct };
