const express = require("express");
const app = express();
const puppeteer = require("puppeteer"); // ✅ NOT puppeteer-core
const { generate, exportHandler } = require("./src/myhandler");

app.use(express.json({ limit: "10mb" }));

app.post("/generate",generate );
app.post("/knockPDF",exportHandler);


// 👇 this must use the correct port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ PDF service running on port ${PORT}`);
});
