const express = require("express");
const app = express();
const puppeteer = require("puppeteer"); // ✅ NOT puppeteer-core
const { generate, exportHandler } = require("./src/myhandler");

app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {

  res.send("Hello World! This is a PDF generation service.");

  console.log("📥 /hit")
  });

app.get("/generate", (req, res) => {

  generate(req, res);
  res.send("I need PDF NOWW!!!!.");

  console.log("📥 /generated")
  });

app.post("/knockPDF", exportHandler) ;
  


// 👇 this must use the correct port
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ PDF service running on port ${PORT}`);
});
