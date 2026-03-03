const { getProductModel, productSchema } = require("../models/productModel");
const mongoose = require("mongoose");

async function storeJalalSonsData(items) {
  try {
    const productModel = getProductModel("Jalal Sons");
    let processedCount = 0;
    let skippedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 1; i < items.length; i++) {
      if (!items[i] || !items[i][3] || items[i][3].trim() === "") {
        skippedCount++;
        continue;
      }

      const productName = items[i][3]?.trim() || "";
      const priceString = (items[i][4] || "").toString().replace(/,/g, "");
      const originalPrice = parseFloat(priceString) || 0;
      const discountedPrice = originalPrice;
      const productImage = items[i][5]?.trim() || "";
      let productURL = items[i][6]?.trim() || "";

      if (originalPrice === 0) {
        skippedCount++;
        continue;
      }

      let filter;
      if (productURL) {
        filter = {
          productURL: productURL,
          productName: productName,
          availableAt: "Jalal Sons",
        };
      } else if (productImage) {
        filter = {
          productName: productName,
          productImage: productImage,
          originalPrice: originalPrice,
          availableAt: "Jalal Sons",
        };
      } else {
        filter = {
          productName: productName,
          originalPrice: originalPrice,
          availableAt: "Jalal Sons",
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
          discount: 0,
          availableAt: "Jalal Sons",
        },
        { upsert: true, new: true }
      );

      if (isNew) {
        createdCount++;
      } else {
        updatedCount++;
        console.log(`[UPDATED] ${productName}`);
        console.log(
          `  Original Price: ${originalPrice}, Discounted Price: ${discountedPrice}, Discount: 0%`
        );
      }
      processedCount++;
    }

    console.log(
      `Jalal Sons: ${processedCount} processed (${createdCount} created, ${updatedCount} updated), ${skippedCount} skipped`
    );
  } catch (error) {
    console.error("Error storing products:", error);
    throw error;
  }
}

const displayProducts = async () => {
  const productModel = mongoose.model(
    "Jalal Sons",
    productSchema,
    "Jalal Sons"
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
      "Jalal Sons",
      productSchema,
      "Jalal Sons"
    );

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

module.exports = { storeJalalSonsData, displayProducts, displayProduct };
