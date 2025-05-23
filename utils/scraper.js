const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");

async function fetchPageData(url) {
  try {
    const response = await axios.get(url, {
      validateStatus: (status) => true, // handle non-2xx manually
    });

    if (response.status === 403) {
      console.error(`❌ Access forbidden (403) for ${url}`);
      return { url, error: "403 Forbidden", textContent: "", links: [] };
    }

    if (response.status === 404) {
      console.error(`❌ Page not found (404) for ${url}`);
      return { url, error: "404 Not Found", textContent: "", links: [] };
    }

    if (response.status !== 200) {
      console.error(`❌ HTTP error ${response.status} for ${url}`);
      return { url, error: `HTTP error ${response.status}`, textContent: "", links: [] };
    }

    const html = response.data;
    const $ = cheerio.load(html);

    const textContent = $("body").text().replace(/\s+/g, " ").trim().substring(0, 1000);
    const links = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        try {
          const absoluteUrl = new URL(href, url).toString();
          links.push(absoluteUrl);
        } catch (e) {
          // Skip malformed URLs
        }
      }
    });

    return { url, textContent, links };
  } catch (err) {
    console.error(`❌ Failed to fetch ${url}:`, err.message);
    return { url, error: err.message, textContent: "", links: [] };
  }
}

async function scrapeSinglePage(url) {
  // Just fetch and return data for the single URL without following links
  return await fetchPageData(url);
}

module.exports = { scrapeSinglePage };
