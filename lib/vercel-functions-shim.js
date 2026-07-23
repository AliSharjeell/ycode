// Shim for @vercel/functions
// The desktop app does not run on Vercel, so cache-tag invalidation is a
// no-op. We keep the import surface so the renderer code compiles.
async function addCacheTag(_tags) {
  // no-op
}

function unstable_cacheTag(_tags) {
  // no-op
}

module.exports = { addCacheTag, unstable_cacheTag };
module.exports.default = { addCacheTag, unstable_cacheTag };
