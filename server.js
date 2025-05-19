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
  const { html } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "1in", bottom: "1in", left: "0.5in", right: "0.5in" }
    });

    await browser.close();

    const filename = `pdf_${Date.now()}.pdf`;
    const filepath = path.join(FILE_DIR, filename);
    fs.writeFileSync(filepath, pdf);

    res.json({ filepath: `/get-pdf?filepath=${filename}` });
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Failed to generate PDF");
  }
});

app.get("/get-pdf", (req, res) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PDF service running on port ${PORT}`));
