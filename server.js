// var cors = require('cors')
// const express = require("express");
// const puppeteer = require("puppeteer"); // ✅ NOT puppeteer-core
// const { generate, exportHandler } = require("./src/myhandler");

import express from "express";
import { generate, exportHandler } from "./src/myhandler.js";
const app = express();


// var corsOptions = {
//   origin: 'https://joshichinidhi.atlassian.net',
// }

app.use(express.json({ limit: "10mb" }));
// app.use(cors(corsOptions));

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
