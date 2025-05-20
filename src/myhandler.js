import api, { route } from "@forge/api";
import fetch from "node-fetch";

const PDF_GENERATION_ENDPOINT = "https://confluence-pdf-exporter.onrender.com/generate";

export const generate = async (res) => {

  try {
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


export const exportHandler = async (req, res) => {
  try {
    console.log("📥 /export hit");

    const contentId = req?.payload?.contentId; 65158;
    console.log("📥 Received contentId:", contentId);
    if (!contentId) {
      console.log("❌ No contentId found in payload:", req?.payload);
      return new Response("Missing contentId", { status: 400 });
    }

    console.log("📥 Received contentId:", contentId);

    // Fetch page content
    let pageData;
    try {
      const pageRes = await api.asApp().requestConfluence(
        route`/wiki/rest/api/content/${contentId}?expand=body.storage,title,space`
      );
      pageData = await pageRes.json();
    } catch (fetchErr) {
      console.error("❌ Failed to fetch page content:", fetchErr);
      return new Response("Failed to fetch page content", { status: 500 });
    }

    const { title: pageTitle, body, space } = pageData;
    const pageBody = body?.storage?.value;
    const spaceKey = space?.key;

    if (!pageBody || !pageTitle || !spaceKey) {
      console.error("❌ Missing required page fields:", pageData);
      return new Response("Page data incomplete", { status: 500 });
    }

    // Try to get branding page
    let logoLeft = null, logoRight = null;
    try {
      const brandingRes = await api.asApp().requestConfluence(
        route`/wiki/rest/api/content?title=PDF Branding&spaceKey=${spaceKey}&expand=body.storage`
      );
      const brandingData = await brandingRes.json();
      const brandingHTML = brandingData?.results?.[0]?.body?.storage?.value;

      if (brandingHTML) {
        const matches = [...brandingHTML.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)];
        logoLeft = matches[0]?.[1] ? `https://joshichinidhi.atlassian.net${matches[0][1]}` : null;
        logoRight = matches[1]?.[1] ? `https://joshichinidhi.atlassian.net${matches[1][1]}` : null;
      }
    } catch (brandingErr) {
      console.warn("⚠️ Branding fetch failed or not available:", brandingErr);
    }

    // Compose HTML
    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; margin: 1in; }
            header, footer { position: fixed; width: 100%; }
            header {
              top: 0; display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 14px;
            }
            footer {
              bottom: 0;
              text-align: center;
              font-size: 10px;
            }
            main { margin-top: 100px; margin-bottom: 80px; }
            img { height: 40px; }
          </style>
        </head>
        <body>
          <header>
            ${logoLeft ? `<img src="${logoLeft}" />` : ""}
            <span>${pageTitle} — ${new Date().toLocaleDateString()}</span>
            ${logoRight ? `<img src="${logoRight}" />` : ""}
          </header>
          <main>${pageBody}</main>
          <footer>Confidential | Company Name</footer>
        </body>
      </html>
    `;

    // Send to Render service
    let pdfServiceRes;
    try {
      pdfServiceRes = await fetch(PDF_GENERATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });

      console.log("📡 Status:", pdfServiceRes.status);
      const raw = await pdfServiceRes.text();
      console.log("📡 Body:", raw);
    } catch (networkErr) {
      console.error("❌ Failed to contact PDF microservice:", networkErr);
      return new Response("PDF service unreachable", { status: 502 });
    }

    if (!pdfServiceRes.ok) {
      const errorText = await pdfServiceRes.text();
      console.error("❌ PDF generation error:", errorText);
      return new Response("Failed to generate PDF", { status: 500 });
    }

    const { filepath } = await pdfServiceRes.json();
    try {
      const parsed = JSON.parse(raw);
      filepath = parsed.filepath;
    } catch (jsonErr) {
      console.error("❌ JSON parsing error:", jsonErr);
      return new Response("Invalid JSON from Render", { status: 500 });
    }

    if (!filepath) {
      console.error("❌ No filepath returned from Render service.");
      return new Response("Missing PDF filepath", { status: 500 });
    }

    console.log("✅ PDF ready at:", filepath);

    return new Response(JSON.stringify({ filepath }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ Unexpected export error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
