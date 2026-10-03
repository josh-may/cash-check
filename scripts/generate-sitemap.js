// The personal app deliberately publishes no URLs for search engines.
const fs = require("fs");
const path = require("path");
fs.writeFileSync(
  path.join(process.cwd(), "public", "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" />\n'
);
