const mongoose = require("mongoose");
const { Schema } = mongoose;
const crypto = require("crypto");

const productSchema = new Schema(
  {
    productID: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomUUID(),
    },
    productName: {
      type: String,
      required: true,
    },
    productDescription: {
      type: String,
      required: false,
      default: "",
    },
    productImage: {
      type: String,
      required: true,
    },
    productURL: {
      type: String,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: false,
      default: 0,
    },
    discountedPrice: {
      type: Number,
      required: false,
      default: function () {
        return this.originalPrice || 0;
      },
    },
    availableAt: {
      type: String,
      required: true,
      default: "",
    },
  },
  { timestamps: true }
);

const getProductModel = (storeName) => {
  if (!storeName) {
    throw new Error("Store name is required");
  }

  const collectionName = storeName;

  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }

  return mongoose.model(collectionName, productSchema, collectionName);
};

module.exports = { getProductModel, productSchema };
