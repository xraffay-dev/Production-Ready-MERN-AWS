const mongoose = require("mongoose");
const { getProductModel, productSchema } = require("../models/productModel");

async function storeRahimStoreData(items) {
  try {
    const productModel = getProductModel("Rahim Store");
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
      const originalPriceStr = (items[i][2] || "").toString().replace(/,/g, "");
      const originalPrice = parseFloat(originalPriceStr) || 0;
      const discountedPriceStr = (items[i][1] || "")
        .toString()
        .replace(/,/g, "");
      const discountedPrice = parseFloat(discountedPriceStr) || originalPrice;
      let productURL = items[i][3]?.trim() || "";
      const productImage = items[i][4]?.trim() || "";

      if (originalPrice === 0) {
        skippedCount++;
        continue;
      }

      let discount = 0;
      if (originalPrice > 0 && discountedPrice < originalPrice) {
        discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
      }

      let filter;
      if (productURL) {
        filter = {
          productURL: productURL,
          productName: productName,
          availableAt: "Rahim Store",
        };
      } else if (productImage) {
        filter = {
          productName: productName,
          productImage: productImage,
          originalPrice: originalPrice,
          availableAt: "Rahim Store",
        };
      } else {
        filter = {
          productName: productName,
          originalPrice: originalPrice,
          availableAt: "Rahim Store",
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
          availableAt: "Rahim Store",
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
      `Rahim Store: ${processedCount} processed (${createdCount} created, ${updatedCount} updated), ${skippedCount} skipped`
    );
  } catch (error) {
    console.error("Error storing products:", error);
    throw error;
  }
}

const displayProducts = async () => {
  const productModel = mongoose.model(
    "Rahim Store",
    productSchema,
    "Rahim Store"
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
      "Rahim Store",
      productSchema,
      "Rahim Store"
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

module.exports = { storeRahimStoreData, displayProducts, displayProduct };
