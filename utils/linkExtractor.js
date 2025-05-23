const puppeteer = require("puppeteer");

const extractLinks = async (baseUrl) => {
  // console.log("hello");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

    const links = await page.evaluate(() => {
      const linkMap = {};
      document.querySelectorAll("a").forEach((a) => {
        const href = a.href;
        const text = a.innerText.toLowerCase();

        if (href.match(/\.pdf$/i)) {
          if (text.includes("manual")) {
            linkMap["user_manual"] = href;
          } else if (text.includes("warranty")) {
            linkMap["warranty_info"] = href;
          } else if (text.includes("spec") || text.includes("data sheet")) {
            linkMap["spec_sheet"] = href;
          } else {
            linkMap[`other_pdf_${Object.keys(linkMap).length}`] = href;
          }
        }

        if (!Object.values(linkMap).includes(href) && text.includes("specs")) {
          linkMap["specs_page"] = href;
        }
      });

      console.log(linkMap);

      return linkMap;
    });

    await browser.close();
    return links;
  } catch (err) {
    console.error("Link Extraction Error:", err);
    await browser.close();
    return {};
  }
};

module.exports = extractLinks;
