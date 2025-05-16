const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));

app.post("/generate", async (req, res) => {
  const { html } = req.body;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "1in", bottom: "1in", left: "0.5in", right: "0.5in" },
  });

  await browser.close();
  res.setHeader("Content-Type", "application/pdf");
  res.send(pdf);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PDF service running on port ${PORT}`));
