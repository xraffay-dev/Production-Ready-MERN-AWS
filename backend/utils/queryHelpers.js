/**
 * Pagination utility for store controllers
 */

/**
 * Apply pagination to a Mongoose query
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter object
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated results with metadata
 */
async function paginateQuery(model, filter = {}, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const total = await model.countDocuments(filter);
  const data = await model.find(filter).skip(skip).limit(limit).lean();

  return {
    success: true,
    status: 200,
    count: data.length,
    total: total,
    page: page,
    limit: limit,
    totalPages: Math.ceil(total / limit),
    data: data,
  };
}

/**
 * Sanitize search query to prevent regex injection
 * @param {string} query - User input query
 * @returns {string} Sanitized query
 */
function sanitizeSearchQuery(query) {
  if (!query || typeof query !== "string") {
    return "";
  }
  // Escape special regex characters
  return query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim();
}

module.exports = {
  paginateQuery,
  sanitizeSearchQuery,
};
