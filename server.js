const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
var bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const dotenv = require("dotenv");
require("dotenv").config();

const readPdfText = require("./utils/pdfReader");
const askGemini = require("./utils/gemini");
const {
  buildPromptFromInvoiceText,
  buildPromptFromForm,
} = require("./utils/promptBuilder");
const extractLinks = require("./utils/linkExtractor");
const { scrapeSinglePage } = require("./utils/scraper");
const { askGeminiWithImage, askGeminiWithText } = require("./utils/imggemini");
const getImages = require("./utils/getImage");

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() }); // in-memory storage, no disk save

const generateId = () => crypto.randomBytes(3).toString("hex");

// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "react",
// });

const db = require("./db");

// Insert into users table
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if the email already exists
    const checkEmailSql = "SELECT * FROM users WHERE email = ?";
    const checkResult = await db.execute(checkEmailSql, [email]);

    if (checkResult.rows.length > 0) {
      return res.json("Email already exists");
    }

    // 2. Insert new user
    const insertUserSql = `
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
    `;
    const insertResult = await db.execute(insertUserSql, [
      name,
      email,
      password,
    ]);

    return res.json({
      message: "User registered successfully",
      result: insertResult,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json("Database error");
  }
});

// login using email of users table
app.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    const result = await db.execute(sql, [email]);

    if (result.rows.length > 0) {
      return res.json("Success");
    } else {
      return res.json("Failed");
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json("Error");
  }
});

const cleanAIResponse = (rawText) => {
  return rawText.replace(/```json|```/g, "").trim();
};

app.post("/addgadgetinv", upload.single("invoice"), async (req, res) => {
  try {
    const email = req.body.email;
    const file = req.file;

    if (!file) {
      return res.status(400).send("No invoice file uploaded.");
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".pdf") {
      return res.status(400).send("Only PDF files are supported.");
    }

    const buffer = file.buffer;
    const rawText = await readPdfText(buffer);
    const prompt = buildPromptFromInvoiceText(rawText);

    const aiResponse = await askGeminiWithText(prompt);
    console.log("AI Raw Response:\n", aiResponse);

    const cleaned = cleanAIResponse(aiResponse);
    const parsed = JSON.parse(cleaned);

    // Optional scraping
    let extractedInfo = "";
    // if (parsed.links?.product_support_page) {
    //   const scrapeResults = await scrapeSinglePage(parsed.links.product_support_page);
    //   extractedInfo = JSON.stringify(scrapeResults, null, 2);
    // }

    // const linksData = await extractLinks(parsed.links?.product_support_page || "");

    // Fetch image from Unsplash
    let imageUrl = null;
    try {
      const images = await getImages(
        parsed.gadget_name || parsed.model || "technology devices"
      );
      console.log(images);
      if (images.length > 0) {
        imageUrl = images[0].url;
      }
    } catch (imgErr) {
      console.error("Image fetch failed:", imgErr.message);
    }

    const unique_id = generateId().substring(0, 6);

    const sql = `
      INSERT INTO products (
        unique_id, gadget_name, model, model_code, purchase_date,
        imageLink, warranty_period, email, links, extracted_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      unique_id,
      parsed.gadget_name,
      parsed.model,
      parsed.model_code,
      parsed.purchase_date,
      imageUrl, // Use fetched image URL here
      parsed.warranty_period,
      email,
      JSON.stringify({ provided: parsed.links }), //, extracted: linksData
      extractedInfo || aiResponse,
    ];

    await db.execute(sql, values);

    res.status(200).send("Gadget added from invoice!");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Failed to process invoice.");
  }
});

app.post("/addgadgetinfo", upload.none(), async (req, res) => {
  try {
    const email = req.body.email;

    const form = {
      gadgetName: req.body.gadgetName,
      brandModel: req.body.brandModel,
      purchaseDate: req.body.purchaseDate,
      price: req.body.price,
    };

    const prompt = buildPromptFromForm(form);
    const aiResponse = await askGemini(prompt);
    console.log(aiResponse);

    const cleaned = cleanAIResponse(aiResponse);
    const parsed = JSON.parse(cleaned);

    // Fetch image from Unsplash
    let imageUrl = null;
    try {
      const images = await getImages(
        parsed.gadget_name || parsed.model || "technology devices"
      );
      console.log(images);
      if (images.length > 0) {
        imageUrl = images[0].url;
      }
    } catch (imgErr) {
      console.error("Image fetch failed:", imgErr.message);
    }

    // ✅ Scrape main link (if available)
    let extractedInfo = "";
    // if (parsed.links?.product_support_page) {
    //   const scrapeResults = await scrapeSinglePage(
    //     parsed.links.product_support_page
    //   );
    //   extractedInfo = JSON.stringify(scrapeResults, null, 2);
    // }

    // const linksData = await extractLinks(
    //   parsed.links?.product_support_page || ""
    // );

    // Convert purchase date to YYYY-MM-DD
    const formattedDate = form.purchaseDate
      ? new Date(form.purchaseDate).toISOString().split("T")[0]
      : null;

    const unique_id = generateId().substring(0, 6);

    const sql = `
      INSERT INTO products (
        unique_id, gadget_name, model, model_code, purchase_date,
        imageLink, warranty_period, email, links, extracted_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      unique_id,
      form.gadgetName,
      parsed.model || null,
      parsed.model_code || null,
      formattedDate,
      imageUrl,
      parsed.warranty_period || null,
      email,
      JSON.stringify({
        provided: parsed.links,
        // scraped: linksData,
      }),
      extractedInfo || aiResponse,
    ];

    await db.execute(sql, values);
    res.status(200).send("Gadget added from manual entry!");
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).send("Failed to process manual gadget info.");
  }
});

app.get("/", (req, res) => {
  res.send("Gadget Manager API running ");
});

app.get("/viewProducts", async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const sql = `
    SELECT 
      id,
      unique_id,
      gadget_name,
      model,
      model_code,
      purchase_date,
      imageLink,
      warranty_period,
      links,
      extracted_info
    FROM products
    WHERE email = ?
  `;

  try {
    const result = await db.execute(sql, [email]);
    return res.json(result.rows);
  } catch (err) {
    console.error("Error retrieving products:", err);
    return res.status(500).json({ error: "Error retrieving products" });
  }
});

app.post("/addService", async (req, res) => {
  const { email, maintenanceType, dateOfMaintenance, productName } = req.body;

  // Validate input
  if (!maintenanceType || !dateOfMaintenance || !productName) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    INSERT INTO services (mtype, mdate, number)
    VALUES (?, ?, ?)
  `;

  try {
    const result = await db.execute(sql, [
      maintenanceType,
      dateOfMaintenance,
      productName, // stored in `number` column
    ]);

    res.status(200).json({
      message: "Service registered successfully",
    });
  } catch (error) {
    console.error("Database insertion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(8081, () => {
  console.log("listening");
});

app.post("/askAI", async (req, res) => {
  try {
    const { prompt } = req.body;
    const reply = await askGemini(prompt); // your AI wrapper function
    res.json({ reply });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ reply: "AI service failed." });
  }
});
