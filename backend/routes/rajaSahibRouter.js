const { Router } = require("express");
const {
  displayProducts,
  displayProduct,
} = require("../controllers/rajaSahibController");

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await displayProducts();
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
