/**
 * This file serves as a placeholder for dynamic imports that can't be resolved.
 */

// Empty exports to satisfy the dynamic imports
exports.octet = function() { return {}; };
exports.json = function() { return {}; };
exports.multipart = function() { return {}; };
exports.querystring = function() { return {}; };

// Add any other exported functions needed by formidable
exports.default = {
  octet: exports.octet,
  json: exports.json,
  multipart: exports.multipart,
  querystring: exports.querystring
};

module.exports = exports;
