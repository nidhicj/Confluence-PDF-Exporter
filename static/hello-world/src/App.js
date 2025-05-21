import React, { useEffect, useState } from 'react';
import { invoke, view } from '@forge/bridge';

const PDF_MS = "https://ext-pdf-generator.onrender.com";

function App() {
  const [contentId, setContentId] = useState(null);
  const [spaceKey, setSpaceKey] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log("🔍 App loaded new Code");
  // Fetch page contentId when app loads
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const context = await view.getContext();
        console.log("🔍 Full context:", context);
        const pageId = context?.extension?.content?.id;
        const spaceKey = context?.extension?.space?.key;
        
        if ((!pageId) && (!spaceKey) ) throw new Error("Page ID or SpaceKey not found in context.");
        
        setContentId(pageId);
        setSpaceKey(spaceKey);

        console.log("✅ Found contentId and spaceKey", pageId, spaceKey);
      } catch (error) {
        console.error("❌ Failed to get context:", error);
        alert("Unable to retrieve page context. Please reload the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, []);

  // PDF export handler
  const handleExport = async () => {
   
  
    console.log("📤 Sending contentId and spaceKey to backend:", contentId, spaceKey);
    const res = await fetch(`${PDF_MS}/knockPDF`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ contentId, spaceKey, ping: 'ping' })
     }); 

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ PDF generation failed:", errorText);
      alert("Failed to generate PDF: " + res.statusText);
      return;
    }
    console.log("📤 Got something like res:", res);
    // parse the JSON body
    const data = await res.json();
    console.log("🖖 Handshake from backend:", data); 

    // you should see → { pong: 'pong', filepath: '…' }

    const parsed = typeof res === 'string' ? JSON.parse(res) : res;

    if (!parsed.filepath) {
      console.error("❌ No 'filepath' returned from backend:", parsed);
      alert("Something went wrong. Please try again later.");
      return;
    }

    const downloadUrl = `https://ext-pdf-generator.onrender.com${parsed.filepath}`;
    console.log("📥 Initiating download from:", downloadUrl);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = "confluence-page.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();

  };


  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h3>Export Page as PDF</h3>
      {loading ? (
        <p>Loading page context...</p>
      ) : (
        <button onClick={handleExport}>
          Download PDF
        </button>
      )}
    </div>
  );
}

export default App;
