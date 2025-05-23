// utils/imggemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const mime = require("mime-types");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const imageModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// OCR + understanding from image
const askGeminiWithImage = async (imageBuffer, mimeType, promptText) => {
  const base64Image = imageBuffer.toString("base64");

  const result = await imageModel.generateContent([
    { inlineData: { data: base64Image, mimeType } },
    { text: promptText },
  ]);

  const response = await result.response;
  return response.text();
};


// Text-only prompt (for PDFs)
const askGeminiWithText = async (prompt) => {
  const result = await textModel.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

module.exports = {
  askGeminiWithImage,
  askGeminiWithText,
};
