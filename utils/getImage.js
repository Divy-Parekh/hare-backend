// getImage.js
const axios = require("axios");
require("dotenv").config();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

async function getImages(query, page = 1, perPage = 10) {
  try {
    const response = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query,
        page,
        per_page: perPage,
        orientation: "squarish",
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    const images = response.data.results.map((photo) => ({
      id: photo.id,
      url: photo.urls.raw, // <-- using raw instead of small
      alt: photo.alt_description,
    }));

    return images;
  } catch (error) {
    console.error("Unsplash API error:", error.message);
    throw new Error("Failed to fetch images from Unsplash");
  }
}

module.exports = getImages;
