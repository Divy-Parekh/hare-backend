// utils/pdfReader.js
const pdfParse = require("pdf-parse");

// Directly parse PDF from a Buffer (not from file path)
const readPdfTextFromBuffer = async (buffer) => {
  const data = await pdfParse(buffer);
  return data.text;
};

module.exports = readPdfTextFromBuffer;
