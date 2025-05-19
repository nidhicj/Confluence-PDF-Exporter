const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));

const FILE_DIR = path.join(__dirname, "pdfs");
if (!fs.existsSync(FILE_DIR)) fs.mkdirSync(FILE_DIR);

app.post("/generate", async (req, res) => {
  console.log("📥 /generate hit");

  const { html } = req.body;

  if (!html) {
    console.error("❌ No HTML received in request");
    return res.status(400).json({ error: "Missing HTML content" });
  }

  try {
    console.log("🧪 Launching Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    console.log("🧪 Setting HTML content...");
    await page.setContent(html, { waitUntil: "networkidle0" });

    console.log("🧪 Generating PDF...");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "1in", bottom: "1in", left: "0.5in", right: "0.5in" }
    });

    await browser.close();

    const filename = `pdf_${Date.now()}.pdf`;
    const filepath = path.join(FILE_DIR, filename);
    fs.writeFileSync(filepath, pdf);

    console.log("✅ PDF saved:", filepath);
    res.json({ filepath: `/get-pdf?filepath=${filename}` });

  } catch (err) {
    console.error("❌ Error during PDF generation:", err);
    res.status(500).send("PDF generation failed");
  }
});



app.get("/get-pdf", (req, res) => {

  console.log("📡 Ping received!");
  res.status(200).json({ message: "pong", time: new Date().toISOString() });

  const { filepath } = req.query;

  if (!filepath) {
    return res.status(400).send("Missing filepath");
  }

  const fullPath = path.join(FILE_DIR, filepath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).send("File not found");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filepath}"`);
  res.sendFile(fullPath);
});

const PORT = process.env.PORT ;
app.listen(PORT, () => console.log(`PDF service running on port ${PORT}`));
