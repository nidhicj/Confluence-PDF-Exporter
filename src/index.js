import api, { route } from "@forge/api";
import fetch from "node-fetch"; // Supported in Forge backend

// Replace with your actual PDF microservice endpoint:
const PDF_GENERATION_ENDPOINT = "https://confluence-pdf-exporter.onrender.com/generate";

export const exportHandler = async (req) => {
  const { contentId } = req.payload;

  // Step 1: Get page content
  const pageRes = await api.asApp().requestConfluence(
    route`/wiki/rest/api/content/${contentId}?expand=body.storage,title,space`
  );
  const pageData = await pageRes.json();
  const pageTitle = pageData.title;
  const pageBody = pageData.body.storage.value;
  const spaceKey = pageData.space.key;

  // Step 2: Get branding page from same space
  const brandingRes = await api.asApp().requestConfluence(
    route`/wiki/rest/api/content?title=PDF Branding&spaceKey=${spaceKey}&expand=body.storage`
  );
  const brandingData = await brandingRes.json();
  const brandingPage = brandingData.results[0];

  let logoLeft = null;
  let logoRight = null;

  if (brandingPage) {
    const brandingHTML = brandingPage.body.storage.value;
    const imgMatches = [...brandingHTML.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)];

    logoLeft = imgMatches[0]?.[1]
      ? `https://joshichinidhi.atlassian.net${imgMatches[0][1]}`
      : null;

    logoRight = imgMatches[1]?.[1]
      ? `https://joshichinidhi.atlassian.net${imgMatches[1][1]}`
      : null;
  }

  // Step 3: Build final HTML
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

  // Step 4: Call PDF microservice
  const pdfRes = await fetch(PDF_GENERATION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  });

  if (!pdfRes.ok) {
    const errorText = await pdfRes.text();
    console.error("PDF generation error:", errorText);
    throw new Error("Failed to generate PDF");
  }

  const pdfBuffer = await pdfRes.arrayBuffer();

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pageTitle}.pdf"`
    }
  });
};
