import api, { route } from '@forge/api';
import { getSignedUrl } from '@forge/bridge/outgoing';

export async function exportPdf(req) {
  const { contentId } = req.body;

  // Fetch page title and body
  const response = await api.asApp().requestConfluence(route`/wiki/rest/api/content/${contentId}?expand=body.storage,title`);
  const data = await response.json();

  const pageTitle = data.title;
  const pageBody = data.body.storage.value;

  // Add custom HTML structure (header, footer)
  const html = `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; margin: 1in; }
          header, footer { position: fixed; width: 100%; }
          header { top: 0; text-align: center; }
          footer { bottom: 0; text-align: center; font-size: 12px; }
          .header-img-left { float: left; height: 40px; }
          .header-img-right { float: right; height: 40px; }
        </style>
      </head>
      <body>
        <header>
          <img class="header-img-left" src="https://example.com/logo-left.png" />
          <span>${pageTitle} - ${new Date().toLocaleDateString()}</span>
          <img class="header-img-right" src="https://example.com/logo-right.png" />
        </header>

        <main style="margin-top: 80px; margin-bottom: 50px;">
          ${pageBody}
        </main>

        <footer>
          Confidential | Company Name
        </footer>
      </body>
    </html>
  `;

  // Use an external API or library to convert HTML to PDF
  const pdfBuffer = await generatePDF(html); // You’ll define this using Puppeteer or a service

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pageTitle}.pdf"`
    }
  });
}
