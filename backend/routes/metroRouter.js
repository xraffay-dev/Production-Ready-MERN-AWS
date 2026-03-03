const { Router } = require("express");
const {
  displayProducts,
  displayProduct,
} = require("../controllers/metroController");

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await displayProducts(page, limit);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  const response = await displayProduct(req.params.id);
  return res.status(response.status).json(response);
});

module.exports = router;
