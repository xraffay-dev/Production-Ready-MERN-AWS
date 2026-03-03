const express = require("express");
const router = express.Router();
const {
  getFeaturedProductsWithMatches,
  getProductMatchesById,
  searchProductMatches,
  getProductRecommendations,
} = require("../controllers/productMatchesController");

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const result = await getFeaturedProductsWithMatches(limit);
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
    const result = await getProductMatchesById(req.params.id);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 20;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query (q) is required",
      });
    }

    const result = await searchProductMatches(q, limit);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/recommendations/:id", async (req, res) => {
  try {
    const productName = req.query.name || null;
    const result = await getProductRecommendations(req.params.id, productName);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
