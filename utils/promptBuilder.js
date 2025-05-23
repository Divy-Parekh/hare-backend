const buildPromptFromInvoiceText = (rawText) => {
  return `
You are an expert AI assistant specialized in extracting **authentic gadget purchase details** from invoices and enriching them with **accurate, official, and verified information**.

Below is the OCR-extracted invoice text:

"""
${rawText}
"""

Your task is to carefully parse this invoice and extract the relevant data. Return a valid JSON object strictly following this structure:

{
  "gadget_name": "Full official product name (e.g., Samsung Galaxy S23 Ultra)",
  "model": "Exact model name (e.g., Galaxy S23 Ultra)",
  "model_code": "Precise manufacturer model code (e.g., SM-S918B/DS)",
  "purchase_date": "ISO date format YYYY-MM-DD",
  "warranty_period": "Official warranty duration (e.g., 1 year, 2 years)",
  "links": {
    "product_page": "✅ Official product page URL (MUST BE FIRST link, fully valid and direct)",
    "product_support_page": "✅ Official support or downloads page for this model",
    "user_manual_link": "✅ Official user manual page or direct PDF link",
    "warranty_info_link": "✅ Official warranty information page from brand or product",
    "legal_info_link": "✅ Official legal or terms-of-service page from the brand"
  },
  "imageLink": "✅ Official or trusted uploaded product image URL (must be direct and valid)",
  "description": "Brief, verified technical summary from official product documentation"
}

🔒 STRICT LINK RULES:
- All URLs must be fully qualified, direct, and resolvable with no 404 errors or redirects.
- URLs must be from official brand domains only (e.g., samsung.com, apple.com, dell.com).
- The first link in the 'links' object must always be the official main product page.
- The 'imageLink' must be a valid official product image or trusted uploaded image URL.
- Do NOT include placeholders, broken links, generic brand portals (e.g., support.hp.com), or third-party retailer/blog links (e.g., Amazon, GSMArena).

Return ONLY the valid JSON object with no explanations, notes, or markdown formatting.
`;
};

const buildPromptFromForm = (data) => {
  return `
You are an AI assistant that enriches user-submitted gadget information with **real, verified product data** sourced exclusively from **official brand sources**.

Here is the user-submitted data:

{
  "gadget_name": "${data.gadgetName}",
  "brand_model": "${data.brandModel}",
  "purchase_date": "${data.purchaseDate}",
  "price": "${data.price}"
}

Using this information, return a valid JSON object enriched with accurate and official data:

{
  "model": "Exact model name (e.g., Galaxy S23 Ultra)",
  "model_code": "Precise manufacturer model code (e.g., SM-S918B/DS)",
  "warranty_period": "Official warranty duration (e.g., 1 year, 2 years)",
  "links": {
    "product_page": "✅ Official product page URL (MUST BE FIRST link, fully valid and direct)",
    "product_support_page": "✅ Official support or downloads page for this model",
    "user_manual_link": "✅ Official user manual page or direct PDF link",
    "warranty_info_link": "✅ Official warranty information page from brand or product",
    "legal_info_link": "✅ Official legal or terms-of-service page from the brand"
  },
  "imageLink": "✅ Official or trusted uploaded product image URL (must be direct and valid)",
  "description": "Short, verified summary from the product’s official support or documentation pages"
}

🔐 LINK QUALITY RULES:
- All links must be fully working, direct, and resolvable with no redirects or placeholders.
- Only use URLs from official brand domains (e.g., dell.com, hp.com).
- The first link must always be the official product page.
- The 'imageLink' must be a correct, direct URL to an official product image or a trusted uploaded image.
- Do NOT include 404 pages, generic brand portals, or non-brand third-party websites.

Return ONLY the valid JSON object without any extra commentary or formatting.
`;
};

module.exports = {
  buildPromptFromInvoiceText,
  buildPromptFromForm,
};
