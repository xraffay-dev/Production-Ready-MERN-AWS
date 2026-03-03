const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file. Please add MONGO_URI to your .env file.");
    }
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "Grocy"
    });
    console.log("MongoDB Connected to Grocy database");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;