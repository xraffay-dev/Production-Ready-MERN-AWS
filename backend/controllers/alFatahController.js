const mongoose = require("mongoose");
const { productSchema } = require("../models/productModel");

async function storeAlFatahData(items) {
  try {
    const productModel = mongoose.model("Al-Fatah", productSchema, "Al-Fatah");
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
      const cleanedPrice = priceStr.replace(/,/g, "");
      const originalPrice = parseFloat(cleanedPrice) || 0;
      const discountedPriceStr = items[i][2]?.trim() || "";
      const cleanedDiscountedPrice = discountedPriceStr.replace(/,/g, "");
      const discountedPrice =
        parseFloat(cleanedDiscountedPrice) || originalPrice;
      const discountStr = items[i][3]?.trim() || "No Discount";
      let productURL = items[i][4]?.trim() || "";
      const productImage = items[i][5]?.trim() || "";

      if (originalPrice === 0 || isNaN(originalPrice)) {
        skippedCount++;
        continue;
      }

      if (productURL.includes("https://alfatah.pkhttps://alfatah.pk")) {
        productURL = productURL.replace(
          "https://alfatah.pkhttps://alfatah.pk",
          "https://alfatah.pk"
        );
      }

      let discount = 0;
      if (discountStr !== "No Discount" && discountStr.includes("%")) {
        const match = discountStr.match(/(\d+\.?\d*)/);
        if (match) {
          discount = parseFloat(match[1]);
        }
      }

      let filter;
      if (productURL) {
        filter = {
          productURL: productURL,
          productName: productName,
          availableAt: "Al-Fatah",
        };
      } else if (productImage) {
        filter = {
          productName: productName,
          productImage: productImage,
          originalPrice: originalPrice,
          availableAt: "Al-Fatah",
        };
      } else {
        filter = {
          productName: productName,
          originalPrice: originalPrice,
          availableAt: "Al-Fatah",
        };
      }

      try {
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
            availableAt: "Al-Fatah",
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
      } catch (dbError) {
        console.error(`Error processing row ${i + 1}:`, dbError.message);
        skippedCount++;
      }
    }

    console.log(
      `Al-Fatah: ${processedCount} processed (${createdCount} created, ${updatedCount} updated), ${skippedCount} skipped`
    );
  } catch (error) {
    console.error("Error storing products:", error);
    throw error;
  }
}

const displayProducts = async () => {
  const productModel = mongoose.model("Al-Fatah", productSchema, "Al-Fatah");
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
    const productModel = mongoose.model("Al-Fatah", productSchema, "Al-Fatah");
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

module.exports = { storeAlFatahData, displayProducts, displayProduct };
