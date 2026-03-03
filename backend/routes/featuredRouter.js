const express = require("express");
const router = express.Router();
const {
  getFeaturedProducts,
  getRandomFeaturedProducts,
  getProductById,
  getRelatedProducts,
} = require("../controllers/featuredController");

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const result = await getFeaturedProducts(limit);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/random", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const result = await getRandomFeaturedProducts(limit);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/product/:id", async (req, res) => {
  try {
    const result = await getProductById(req.params.id);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/related/:id", async (req, res) => {
  try {
    const { category } = req.query;
    const limit = parseInt(req.query.limit) || 4;
    const result = await getRelatedProducts(req.params.id, category, limit);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
