const express = require("express");
const app = express();
const puppeteer = require("puppeteer"); // ✅ NOT puppeteer-core

app.use(express.json({ limit: "10mb" }));

app.post("/generate", async (req, res) => {
  try {
    console.log("📥 /generate hit");
    console.log("🧪 Launching Puppeteer...");

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: `/usr/bin/chromium-browser`,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(req.body.html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "1in", bottom: "1in", left: "0.5in", right: "0.5in" }
    });

    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (err) {
    console.error("❌ Error during PDF generation:", err);
    res.status(500).send("PDF generation failed");
  }
});

// 👇 this must use the correct port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ PDF service running on port ${PORT}`);
});
