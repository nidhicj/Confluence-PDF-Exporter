import api, { route } from "@forge/api";
import fetch from "node-fetch";
// const fetch = require("node-fetch");
import * as cheerio from 'cheerio';
import { PNG } from "pngjs";
import { getSecret } from '@forge/secrets';

const OFFICE_DOMAIN = "https://joshichinidhi.atlassian.net";
const PDF_BRANDING_PAGE = "PDF Branding";

export const generate = async (req, res) => {

  try{
    console.log("📥 /generate hit");
    console.log("🧪 Launching Puppeteer...");

    const browser = await puppeteer.launch({
      headless: true,
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
}

async function isPngValid(url) {
  // 1. Download the raw bytes
  // const res = await fetch(url, { headers: authHeaders });
  const res = await api
    .asApp()
    .requestConfluence(
      route`${url}`);

  if (!res.ok) {
    console.warn(`Failed to download image: ${res.status}`);
    return false;
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2. Quick signature check (optional, but cheap)
  const pngSignature = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  if (!buffer.slice(0, 8).equals(pngSignature)) {
    console.warn("Not a PNG (bad signature)");
    return false;
  }

  // 3. Actually try to parse all chunks
  try {
    PNG.sync.read(buffer);
    return true;    // parse succeeded → valid PNG
  } catch (err) {
    console.error("PNG parse error:", err);
    return false;   // parse threw → corrupt or truncated
  }
}


export const exportHandler = async (req) => {
  
  // console.log(" /export hit", req);
  
  let contentId = req.call?.payload?.contentId || req.payload?.contentId 
  // console.log(" contentId from payload:", contentId);
  if (!contentId) {
    // console.log(" No contentId in payload, using context");
    contentId = req.context?.extension?.content?.id || req.context?.content?.id             // local resolver
  }
  // console.log(" Received contentId:", contentId);
  
  
  let spaceKey = req.space  // remote endpoint
  // console.log(" spaceKey from payload:", spaceKey);
  if (!spaceKey) {
    // console.log(" No spaceKey in payload, using context");
    spaceKey = req.context?.extension?.space?.key || req.context?.space?.key;             // local resolver
  }
  // console.log(" Received spaceKey:", spaceKey);


  // 1. Fetch page body.storage
  const res = await api
    .asApp()
    .requestConfluence(
      route`/wiki/api/v2/pages/${contentId}?body-format=storage`
    );

  if (!res.ok) {
    throw new Error(`Failed to fetch page: ${res.status}`);
  }
  const pageData = await res.json();
  // console.log(" Page data:", pageData);
  
  // 1) Fetch the page data (you already have this part)
  const { title: pageTitle, body} = pageData;
  const pageBody = body?.storage?.value;

  if (!pageBody || !pageTitle ) {
    // console.error("❌ Missing required page fields:", pageData);
    return new Response("Page data incomplete", { status: 500 });
  }
  // console.log(" Page title:", pageTitle);


  // 2) Fetch branding HTML & extract logos (your existing logic)
  // Try to get branding page
  
  // 2. Call Confluence
  const cql = `type=page AND space="${spaceKey}" AND title="${PDF_BRANDING_PAGE}"`;
  const brandingRes = await api.asApp().requestConfluence(route`/wiki/rest/api/search?cql=${cql}`, {
    headers: {
      'Accept': 'application/json'
      }
    });
    
    if (!brandingRes.status >= 300) {
    throw new Error(`Page fetch failed: ${brandingRes.status}`);
    }
  
  const brandingJson = await brandingRes.json();

  // 4) Inspect what you actually got
  // console.log("📝 brandingJson =", JSON.stringify(brandingJson, null, 2));
  

  const branding_pageId = brandingJson.results?.[0]?.content?.id;

  console.log("branding_pageId =", branding_pageId);
  if (!branding_pageId) {
    console.error("❌ No branding page found.");
    return new Response("Branding page not found", { status: 500 });
  }

  const brandingPage_attachments = await api.asApp().requestConfluence(route`/wiki/api/v2/pages/${branding_pageId}/attachments`,{
    headers: {
      'Accept': 'application/json'
    }
  });

  // console.log(`Response: ${brandingPage_attachments.status} ${brandingPage_attachments.statusText}`);
  if (brandingPage_attachments.status > 300) {
    console.error("❌ Failed to fetch branding page:", brandingPage_attachments.status);
    return new Response("Failed to fetch branding page", { status: 500 });
  }

  const brandingPage_attachments_json =  await brandingPage_attachments.json();
  console.log("brandingPage_attachments_json =", brandingPage_attachments_json);
  
  const leftLogo_webuiLink = `${OFFICE_DOMAIN}/wiki${brandingPage_attachments_json.results?.[0]?.webuiLink}`;
  const rightLogo_webuiLink = `${OFFICE_DOMAIN}/wiki${brandingPage_attachments_json.results?.[1]?.webuiLink}`;

  const leftlogo_downloadLink = `${OFFICE_DOMAIN}/wiki${brandingPage_attachments_json.results?.[0]?.downloadLink}`;
  const rightlogo_downloadLink = `${OFFICE_DOMAIN}/wiki${brandingPage_attachments_json.results?.[1]?.downloadLink}`;

  console.log("leftLogo_downloadLink =", leftlogo_downloadLink);
  console.log("rightLogo_downloadLink =", rightlogo_downloadLink);

  // console.log("leftLogo_webuiLink =", leftLogo_webuiLink);
  // console.log("rightLogo_webuiLink =", rightLogo_webuiLink);

  const currentPage_html = pageData.body.storage.value;
  // console.log("currentPage_html =", currentPage_html);

  // 3) Start building with Cheerio
  //    — load only the <body> fragment for easy manipulation
  const $ = cheerio.load(currentPage_html);
  console.log("📝 Loaded page body with Cheerio", pageData);


  // 4) Create your header and footer nodes
  const header = cheerio.load(`<header></header>`)("header")
    .css({
      position: "fixed",
      top: 0,
      width: "100%",
      display: "flex",
      "justify-content": "space-between",
      "align-items": "center",
      "font-size": "14px",
      padding: "0.5em 0",
      "border-bottom": "1px solid #ccc"
    })
    .prepend( `${leftlogo_downloadLink}`
      ? `<img src="${leftlogo_downloadLink}" style="height:40px"/>`
      : ""
    )
    .append(
      `<span>${pageTitle} — ${new Date().toLocaleDateString()}</span>`
    )
    .append( `${rightlogo_downloadLink}`
      ? `<img src="${rightlogo_downloadLink}" style="height:40px"/>`
      : ""
    );

  const footer = cheerio.load(`<footer></footer>`)("footer")
    .css({
      position: "fixed",
      bottom: 0,
      width: "100%",
      "text-align": "center",
      "font-size": "10px",
      padding: "0.5em 0",
      "border-top": "1px solid #ccc"
    })
    .text("Confidential | Company Name");

  // 5) Inject header and footer into the body
  $("body").prepend(header);
  $("body").append(footer);

  // 6) Wrap with full HTML and styles
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: sans-serif; margin: 1in; }
          main { margin-top: 100px; margin-bottom: 80px; }
        </style>
      </head>
      <body>
        <main>${$.html()}</main>
      </body>
    </html>
  `;

  // 7) Return the transformed HTML for PDF rendering
    console.log("📤 Backend Transformed HTML:", fullHtml);
  return { body: fullHtml, error: null };   

};
