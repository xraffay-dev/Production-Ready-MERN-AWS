require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/dbConfig");
const extractData = require("./utils/extractData");
const metroRouter = require("./routes/metroRouter");
const alFatahRouter = require("./routes/alFatahRouter");
const featuredRouter = require("./routes/featuredRouter");
const jalalSonsRouter = require("./routes/jalalSonsRouter");
const rajaSahibRouter = require("./routes/rajaSahibRouter");
const rahimStoreRouter = require("./routes/rahimStoreRouter");
const productMatchesRouter = require("./routes/productMatchesRouter");
const searchRouter = require("./routes/searchRouter");

const app = express();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// CORS configuration with environment variable
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

const PORT = process.env.PORT || 8000;

connectDB();
// extractData("./scrapped data/Metro.csv", "metro");
// extractData("./scrapped data/Al-Fatah.csv", "alFatah");
// extractData("./scrapped data/Jalal Sons.csv", "jalalSons");
// extractData("./scrapped data/Raja Sahib.csv", "rajaSahib");
// extractData("./scrapped data/Rahim Store.csv", "rahimStore");

app.use("/metro", metroRouter);
app.use("/search", searchRouter);
app.use("/alfatah", alFatahRouter);
app.use("/featured", featuredRouter);
app.use("/jalalsons", jalalSonsRouter);
app.use("/rajasahib", rajaSahibRouter);
app.use("/rahimstore", rahimStoreRouter);
app.use("/matches", productMatchesRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
